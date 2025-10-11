import { prisma } from '../prismaClient';
import { ParsedTransaction } from '../types';

const compositeKey = (tx: Pick<ParsedTransaction, 'date' | 'amount' | 'normalizedKey'>): string =>
  `${tx.date.toISOString()}|${tx.amount}|${tx.normalizedKey}`;

export const dedupeTransactions = async (
  transactions: ParsedTransaction[],
  userId: string,
): Promise<ParsedTransaction[]> => {
  if (!transactions.length) {
    return [];
  }

  const uniqueCombos = new Map<string, ParsedTransaction>();
  for (const tx of transactions) {
    uniqueCombos.set(compositeKey(tx), tx);
  }

  const filters = Array.from(uniqueCombos.values()).map((tx) => ({
    date: tx.date,
    amount: tx.amount,
    normalizedKey: tx.normalizedKey,
  }));

  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      OR: filters,
    },
    select: {
      date: true,
      amount: true,
      normalizedKey: true,
    },
  });

  const existingKeys = new Set(existing.map((tx) => compositeKey(tx)));

  return transactions.filter((tx) => !existingKeys.has(compositeKey(tx)));
};
