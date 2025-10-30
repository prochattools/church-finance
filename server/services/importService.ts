import { Prisma, PrismaClient, TransactionClassificationSource } from '@prisma/client';
import { prisma } from '../prismaClient';
import { parseIngCsv } from '../../lib/import/csv_ING';
import { parseInitialWorkbook } from '../../lib/import/xlsx';
import { attachHashes, partitionDuplicates } from '../../lib/import/dedupe';
import { deriveDirection, normalizeWhitespace } from '../../lib/import/normalizers';
import type { ImportSummary, ImportSummaryRowError, ImportFormat, ParsedRowSuccess } from '../../lib/import/types';
import { categorizeTransaction } from './categorizationService';
import { fetchActiveRules } from './ruleEngine';
import {
  LedgerMismatchError,
  MissingOpeningBalanceError,
  validateLedgerBalance,
} from './reconciliationService';

interface ProcessImportOptions {
  buffer: Buffer;
  filename: string;
  userId: string;
}

type Direction = 'credit' | 'debit';

type TxClient = Prisma.TransactionClient;

const LOCKS_ENABLED = process.env.RECONCILIATION_LOCKS_ENABLED !== 'false';

const ledgerCacheKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${month}`;
};

const normalizeAccountName = (value: string | null): string => {
  if (!value) return 'Unknown account';
  return normalizeWhitespace(value);
};

const splitCategoryLabel = (value: string | null | undefined): { main: string | null; sub: string | null } => {
  if (!value) {
    return { main: null, sub: null };
  }
  const segments = value.split(' — ');
  if (segments.length === 1) {
    const label = segments[0]!.trim();
    return {
      main: label || null,
      sub: label || null,
    };
  }

  const main = segments[0]!.trim() || null;
  const sub = segments.slice(1).join(' — ').trim() || main;

  return {
    main,
    sub,
  };
};

export class LockedPeriodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockedPeriodError';
  }
}

const autoLockLedger = async (tx: TxClient, ledgerId: string, userId: string) => {
  if (!LOCKS_ENABLED) {
    return;
  }

  const existing = await tx.ledger.findUnique({
    where: { id: ledgerId },
    select: {
      lockedAt: true,
    },
  });

  if (!existing || existing.lockedAt) {
    return;
  }

  const now = new Date();

  await tx.ledger.update({
    where: { id: ledgerId },
    data: {
      lockedAt: now,
      lockedBy: userId,
      lockNote: 'Auto-locked after reconciliation',
    },
  });

  await tx.ledgerLock.upsert({
    where: {
      ledgerId,
    },
    create: {
      ledgerId,
      lockedAt: now,
      lockedBy: userId,
      note: 'Auto-locked after reconciliation',
    },
    update: {
      lockedAt: now,
      lockedBy: userId,
      note: 'Auto-locked after reconciliation',
    },
  });
};

const ensureLedger = async (tx: TxClient, userId: string, date: Date): Promise<string> => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  const uniqueWhere = {
    userId_month_year: {
      userId,
      month,
      year,
    },
  } as const;

  const existing = await tx.ledger.findUnique({
    where: uniqueWhere,
    select: {
      id: true,
      lockedAt: true,
    },
  });

  if (existing) {
    if (LOCKS_ENABLED && existing.lockedAt) {
      throw new LockedPeriodError(`Ledger ${year}-${month} is locked`);
    }
    return existing.id;
  }

  const created = await tx.ledger.create({
    data: {
      userId,
      month,
      year,
    },
  });
  return created.id;
};

const detectFormat = (filename: string): ImportFormat => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm') || lower.endsWith('.xls')) {
    return 'xlsx_initial';
  }
  return 'csv_ing';
};

const parseBuffer = async (format: ImportFormat, buffer: Buffer) => {
  if (format === 'xlsx_initial') {
    return parseInitialWorkbook(buffer);
  }
  return parseIngCsv(buffer);
};

const ensureAccounts = async (
  tx: TxClient,
  userId: string,
  rows: ParsedRowSuccess[],
): Promise<Map<string, string>> => {
  const cache = new Map<string, string>();
  const seen = new Set<string>();

  for (const row of rows) {
    const identifier = row.accountIdentifier;
    if (seen.has(identifier)) {
      continue;
    }

    seen.add(identifier);

    const account = await tx.account.upsert({
      where: {
        userId_identifier: {
          userId,
          identifier,
        },
      },
      update: {
        name: normalizeAccountName(row.accountName ?? identifier),
      },
      create: {
        userId,
        identifier,
        name: normalizeAccountName(row.accountName ?? identifier),
        currency: row.currency,
      },
    });

    cache.set(identifier, account.id);
  }

  return cache;
};

const CHUNK_SIZE = 250;

const chunk = <T>(items: T[], size: number): T[][] => {
  if (items.length <= size) return [items];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const REVIEW_CATEGORY_NAME = 'Needs Review';

type SuggestionConfidence = 'exact' | 'description' | 'account' | 'overall' | 'rule' | 'review';

type SuggestionIndex = {
  exact: Map<string, Map<string, number>>;
  byNormalized: Map<string, Map<string, number>>;
  byAccount: Map<string, Map<string, number>>;
  overall: Map<string, number>;
};

const sanitizeIdentifier = (value: string | null | undefined): string => (value ?? '').trim().toUpperCase();

const incrementCounter = (map: Map<string, Map<string, number>>, key: string, categoryId: string) => {
  if (!key) return;
  let bucket = map.get(key);
  if (!bucket) {
    bucket = new Map<string, number>();
    map.set(key, bucket);
  }
  bucket.set(categoryId, (bucket.get(categoryId) ?? 0) + 1);
};

const pickDominant = (bucket?: Map<string, number>): { categoryId: string | null; count: number } => {
  if (!bucket) return { categoryId: null, count: 0 };
  let bestCategory: string | null = null;
  let bestCount = 0;
  bucket.forEach((count, categoryId) => {
    if (count > bestCount) {
      bestCategory = categoryId;
      bestCount = count;
    }
  });
  return { categoryId: bestCategory, count: bestCount };
};

const buildSuggestionIndex = (
  history: Array<{ accountIdentifier: string | null; normalizedKey: string; amountMinor: bigint; categoryId: string }>,
): SuggestionIndex => {
  const index: SuggestionIndex = {
    exact: new Map(),
    byNormalized: new Map(),
    byAccount: new Map(),
    overall: new Map(),
  };

  history.forEach((entry) => {
    if (!entry.categoryId) return;
    const accountKey = sanitizeIdentifier(entry.accountIdentifier ?? '');
    const normalizedKey = entry.normalizedKey ?? '';
    const amountKey = entry.amountMinor.toString();

    incrementCounter(index.exact, `${accountKey}|${amountKey}|${normalizedKey}`, entry.categoryId);
    if (normalizedKey) {
      incrementCounter(index.byNormalized, normalizedKey, entry.categoryId);
    }
    if (accountKey) {
      incrementCounter(index.byAccount, accountKey, entry.categoryId);
    }
    index.overall.set(entry.categoryId, (index.overall.get(entry.categoryId) ?? 0) + 1);
  });

  return index;
};

const registerSuggestion = (
  index: SuggestionIndex,
  accountIdentifier: string | null,
  normalizedKey: string,
  amountMinor: bigint,
  categoryId: string,
) => {
  const accountKey = sanitizeIdentifier(accountIdentifier ?? '');
  const amountKey = amountMinor.toString();

  incrementCounter(index.exact, `${accountKey}|${amountKey}|${normalizedKey}`, categoryId);
  if (normalizedKey) {
    incrementCounter(index.byNormalized, normalizedKey, categoryId);
  }
  if (accountKey) {
    incrementCounter(index.byAccount, accountKey, categoryId);
  }
  index.overall.set(categoryId, (index.overall.get(categoryId) ?? 0) + 1);
};

const suggestCategoryFromIndex = (
  index: SuggestionIndex,
  accountIdentifier: string | null,
  normalizedKey: string,
  amountMinor: bigint,
): { categoryId: string | null; confidence: SuggestionConfidence } | null => {
  const accountKey = sanitizeIdentifier(accountIdentifier ?? '');
  const amountKey = amountMinor.toString();
  const exactBucket = index.exact.get(`${accountKey}|${amountKey}|${normalizedKey}`);
  const exact = pickDominant(exactBucket);
  if (exact.categoryId) {
    return { categoryId: exact.categoryId, confidence: 'exact' };
  }

  const normalized = pickDominant(index.byNormalized.get(normalizedKey));
  if (normalized.categoryId) {
    return { categoryId: normalized.categoryId, confidence: 'description' };
  }

  const account = pickDominant(index.byAccount.get(accountKey));
  if (account.categoryId) {
    return { categoryId: account.categoryId, confidence: 'account' };
  }

  const overall = pickDominant(index.overall.size ? index.overall : undefined);
  if (overall.categoryId) {
    return { categoryId: overall.categoryId, confidence: 'overall' };
  }

  return null;
};

const ensureReviewCategory = async (tx: TxClient): Promise<string> => {
  const category = await tx.category.upsert({
    where: { name: REVIEW_CATEGORY_NAME },
    update: {},
    create: { name: REVIEW_CATEGORY_NAME },
  });

  return category.id;
};

export const processImportBufferWithClient = async (
  client: PrismaClient,
  {
    buffer,
    filename,
    userId,
  }: ProcessImportOptions,
): Promise<ImportSummary> => {
  const format = detectFormat(filename);
  const parsed = await parseBuffer(format, buffer);
  const totalRows = parsed.successes.length + parsed.errors.length;

  return client.$transaction(async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        userId,
        filename,
        fileType: format,
        status: 'pending',
        totalRows,
        errorRows: parsed.errors.length,
      },
    });

    const errors: ImportSummaryRowError[] = parsed.errors.map((error) => ({
      rowNumber: error.rowNumber,
      message: error.message,
    }));

    if (!parsed.successes.length) {
      await tx.importBatch.update({
        where: { id: batch.id },
        data: {
          status: 'completed',
          importedRows: 0,
          duplicateRows: 0,
          completedAt: new Date(),
        },
      });

      return {
        filename,
        format,
        totalRows,
        importedCount: 0,
        duplicateCount: 0,
        errorCount: parsed.errors.length,
        autoCategorizedCount: 0,
        pendingReviewCount: 0,
        batchId: batch.id,
        errors,
      };
    }

    const hashedRows = attachHashes(userId, parsed.successes);
    const enrichedRows = format === 'xlsx_initial'
      ? hashedRows.map((row) => ({ ...row, hash: `${row.hash}|${row.rowNumber}` }))
      : hashedRows;

    const existing = await tx.transaction.findMany({
      where: {
        hash: {
          in: enrichedRows.map((row) => row.hash),
        },
      },
      select: {
        hash: true,
      },
    });

    const existingHashes = new Set(existing.map((entry) => entry.hash));
    const { uniques, duplicates } = partitionDuplicates(enrichedRows, existingHashes);

    const accountMap = await ensureAccounts(tx, userId, uniques);
    const activeRules = await fetchActiveRules(tx, userId);
    const categoriesLookup = await tx.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const categoryNameLookup = new Map<string, string>();
    categoriesLookup.forEach((category) => {
      categoryNameLookup.set(category.id, category.name);
    });

    const ledgerIds = new Map<string, string>();
    const ensureLedgerCached = async (date: Date) => {
      const key = ledgerCacheKey(date);
      const cached = ledgerIds.get(key);
      if (cached) {
        return cached;
      }
      const ledgerId = await ensureLedger(tx, userId, date);
      ledgerIds.set(key, ledgerId);
      return ledgerId;
    };

    const reviewCategoryId = await ensureReviewCategory(tx);

    const historyForSuggestionsRaw = await tx.transaction.findMany({
      where: {
        userId,
        categoryId: {
          not: null,
        },
        classificationSource: 'manual',
      },
      select: {
        categoryId: true,
        amountMinor: true,
        normalizedKey: true,
        account: {
          select: {
            identifier: true,
          },
        },
      },
    });

    const suggestionIndex = buildSuggestionIndex(
      historyForSuggestionsRaw.map((entry) => ({
        categoryId: entry.categoryId!,
        amountMinor: entry.amountMinor,
        normalizedKey: entry.normalizedKey ?? '',
        accountIdentifier: entry.account?.identifier ?? null,
      })),
    );

    let autoCategorized = 0;
    let imported = 0;
    const reconciliationTargets = new Map<string, { accountId: string; month: number; year: number; ledgerId: string }>();

    const now = new Date();

    const chunkedRecords: Array<typeof uniques> = chunk(uniques, CHUNK_SIZE);

    for (const group of chunkedRecords) {
      const records: Array<{
        userId: string;
        accountId: string | null;
        ledgerId: string;
        importBatchId: string;
        date: Date;
        description: string;
        normalizedKey: string;
        amountMinor: bigint;
        currency: string;
        direction: Direction;
        source: string;
        counterparty: string | null | undefined;
        reference: string | null | undefined;
        hash: string;
        sourceFile: string;
        rawRow: Prisma.InputJsonValue;
        categoryId: string;
        classificationSource: TransactionClassificationSource;
        classificationRuleId: string | null;
        createdAt: Date;
        updatedAt: Date;
      }> = [];

      for (const row of group) {
        const ledgerId = await ensureLedgerCached(row.date);
        const accountId = accountMap.get(row.accountIdentifier) ?? null;

        const categorization = await categorizeTransaction(tx, {
          userId,
            source: row.source,
            normalizedDescription: row.normalizedDescription,
            description: row.description,
            amountMinor: row.amountMinor,
            accountIdentifier: row.accountIdentifier,
            counterparty: row.counterparty,
            reference: row.reference,
          }, { rules: activeRules });
          const direction = deriveDirection(row.amountMinor);

          const accountIdentifierForMatch = row.accountIdentifier ?? null;

          let categoryId = categorization.categoryId;
          let classificationSource: TransactionClassificationSource = categorization.classificationSource;
          let suggestionConfidence: SuggestionConfidence =
            classificationSource === 'history'
              ? 'exact'
              : classificationSource === 'rule'
              ? 'rule'
              : 'review';

          if (!categoryId) {
            const suggestion = suggestCategoryFromIndex(
              suggestionIndex,
              accountIdentifierForMatch,
              row.normalizedDescription,
              row.amountMinor,
            );

            if (suggestion && suggestion.categoryId) {
              categoryId = suggestion.categoryId;
              suggestionConfidence = suggestion.confidence;
              classificationSource = suggestion.confidence === 'exact' ? 'history' : 'import';
            } else {
              categoryId = reviewCategoryId;
              suggestionConfidence = 'review';
              classificationSource = 'import';
            }
          }

          const isAutoCategorized = classificationSource === 'history' || classificationSource === 'rule';
          if (isAutoCategorized) {
            autoCategorized += 1;
          }

          if (categoryId && categoryId !== reviewCategoryId) {
            registerSuggestion(
              suggestionIndex,
              accountIdentifierForMatch,
              row.normalizedDescription,
              row.amountMinor,
              categoryId,
            );
          }

          if (accountId) {
            const month = row.date.getUTCMonth() + 1;
            const year = row.date.getUTCFullYear();
            const key = `${accountId}|${year}|${month}`;
            if (!reconciliationTargets.has(key)) {
              reconciliationTargets.set(key, {
                accountId,
                month,
                year,
                ledgerId,
              });
            }
          }

        let suggestedMainName: string | null = null;
        let suggestedSubName: string | null = null;

        if (categoryId === reviewCategoryId) {
          const reviewLabel = categoryNameLookup.get(reviewCategoryId) ?? 'Needs manual categorization';
          const split = splitCategoryLabel(reviewLabel);
          suggestedMainName = split.main ?? 'Review';
          suggestedSubName = split.sub ?? reviewLabel;
        } else if (categoryId) {
          const categoryLabel = categoryNameLookup.get(categoryId) ?? null;
          const split = splitCategoryLabel(categoryLabel);
          suggestedMainName = split.main ?? categoryLabel;
          suggestedSubName = split.sub ?? categoryLabel;
        }

        const baseRaw = (row.raw ?? {}) as Record<string, unknown>;
        const rawPayload: Prisma.InputJsonValue = {
          ...baseRaw,
          suggestion: {
            confidence: suggestionConfidence,
            matchedCategoryId: categoryId,
            matchedBy: classificationSource,
            mainCategoryName: suggestedMainName,
            categoryName: suggestedSubName,
          },
        };

        records.push({
          userId,
          accountId,
          ledgerId,
          importBatchId: batch.id,
          date: row.date,
          description: row.description,
          normalizedKey: row.normalizedDescription,
          amountMinor: row.amountMinor,
          currency: row.currency,
          direction,
          source: row.source,
          counterparty: row.counterparty,
          reference: row.reference,
          hash: row.hash,
          sourceFile: filename,
          rawRow: rawPayload,
          categoryId,
          classificationSource,
          classificationRuleId: categorization.ruleId,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (!records.length) {
        continue;
      }

      const created = await tx.transaction.createMany({
        data: records,
        skipDuplicates: true,
      });

      imported += created.count;
    }

    const duplicateCount = duplicates.length + (uniques.length - imported);
    const pendingReview = imported;

    for (const target of reconciliationTargets.values()) {
      try {
        const validation = await validateLedgerBalance(tx, {
          userId,
          accountId: target.accountId,
          month: target.month,
          year: target.year,
        });

        if (validation.status === 'reconciled') {
          await autoLockLedger(tx, target.ledgerId, userId);
        }
      } catch (error) {
        if (error instanceof MissingOpeningBalanceError) {
          // Skip auto-lock when an opening balance has not been captured yet; imports still succeed.
          continue;
        }
        throw error;
      }
    }

    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'completed',
        importedRows: imported,
        duplicateRows: duplicateCount,
        autoCategorizedRows: autoCategorized,
        errorRows: parsed.errors.length,
        completedAt: new Date(),
      },
    }).catch((): undefined => undefined);

    return {
      filename,
      format,
      totalRows,
      importedCount: imported,
      duplicateCount,
      errorCount: parsed.errors.length,
      autoCategorizedCount: autoCategorized,
      pendingReviewCount: pendingReview,
      batchId: batch.id,
      errors,
    };
  });
};

export const processImportBuffer = (options: ProcessImportOptions) =>
  processImportBufferWithClient(prisma, options);
