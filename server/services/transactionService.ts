import { prisma } from '../prismaClient';
import { ImportSummary, ParsedTransaction } from '../types';
import { parseTransactions } from '../utils/csv';
import { dedupeTransactions } from '../utils/dedupe';
import { categorizeTransaction } from './categorizationService';

interface ProcessCsvOptions {
  buffer: Buffer;
  filename: string;
  userId: string;
}

const ledgerCacheKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${month}`;
};

const ensureLedger = async (userId: string, date: Date): Promise<string> => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  const ledger = await prisma.ledger.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {},
    create: {
      userId,
      month,
      year,
    },
  });

  return ledger.id;
};

export const processCsvBuffer = async ({
  buffer,
  filename,
  userId,
}: ProcessCsvOptions): Promise<ImportSummary> => {
  const parsed = await parseTransactions(buffer);

  if (!parsed.length) {
    return {
      filename,
      importedCount: 0,
      autoCategorized: 0,
      reviewCount: 0,
    };
  }

  const deduped = await dedupeTransactions(parsed, userId);

  if (!deduped.length) {
    return {
      filename,
      importedCount: 0,
      autoCategorized: 0,
      reviewCount: 0,
    };
  }

  const ledgerMap = new Map<string, string>();
  let autoCategorized = 0;

  const records: Array<{
    userId: string;
    ledgerId: string;
    date: Date;
    description: string;
    normalizedKey: string;
    amount: number;
    source: string;
    categoryId: string | null;
  }> = [];

  for (const tx of deduped) {
    const key = ledgerCacheKey(tx.date);
    let ledgerId = ledgerMap.get(key);

    if (!ledgerId) {
      ledgerId = await ensureLedger(userId, tx.date);
      ledgerMap.set(key, ledgerId);
    }

    const { categoryId } = await categorizeTransaction(tx, userId);
    if (categoryId) {
      autoCategorized += 1;
    }

    records.push({
      userId,
      ledgerId,
      date: tx.date,
      description: tx.description,
      normalizedKey: tx.normalizedKey,
      amount: tx.amount,
      source: tx.source,
      categoryId,
    });
  }

  const created = await prisma.transaction.createMany({
    data: records,
    skipDuplicates: true,
  });

  const importedCount = created.count;

  return {
    filename,
    importedCount,
    autoCategorized,
    reviewCount: importedCount - autoCategorized,
  };
};
