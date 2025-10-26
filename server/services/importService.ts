import type { Prisma, PrismaClient } from '@prisma/client';
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

  const existing = await tx.ledger.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
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

    const existing = await tx.transaction.findMany({
      where: {
        hash: {
          in: hashedRows.map((row) => row.hash),
        },
      },
      select: {
        hash: true,
      },
    });

    const existingHashes = new Set(existing.map((entry) => entry.hash));
    const { uniques, duplicates } = partitionDuplicates(hashedRows, existingHashes);

    const accountMap = await ensureAccounts(tx, userId, uniques);
    const activeRules = await fetchActiveRules(tx, userId);

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

    let autoCategorized = 0;
    let imported = 0;
    const reconciliationTargets = new Map<string, { accountId: string; month: number; year: number; ledgerId: string }>();

    const now = new Date();

    for (const group of chunk(uniques, CHUNK_SIZE)) {
      const records = await Promise.all(
        group.map(async (row) => {
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

          if (categorization.categoryId) {
            autoCategorized += 1;
          }

          const direction = deriveDirection(row.amountMinor);

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

          return {
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
            rawRow: row.raw as Prisma.InputJsonValue,
            categoryId: categorization.categoryId,
            classificationSource: categorization.classificationSource,
            classificationRuleId: categorization.ruleId,
            createdAt: now,
            updatedAt: now,
          };
        }),
      );

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
    const pendingReview = imported - autoCategorized;

    for (const target of reconciliationTargets.values()) {
      const validation = await validateLedgerBalance(tx, {
        userId,
        accountId: target.accountId,
        month: target.month,
        year: target.year,
      });

      if (validation.status === 'reconciled') {
        await autoLockLedger(tx, target.ledgerId, userId);
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
