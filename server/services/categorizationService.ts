import { prisma } from '../prismaClient';
import { ParsedTransaction } from '../types';

const AMOUNT_MATCH_THRESHOLD = Number(process.env.AMOUNT_MATCH_THRESHOLD ?? 0.01);

export const categorizeTransaction = async (
  tx: ParsedTransaction,
  userId: string,
): Promise<{ categoryId: string | null }> => {
  const exactMatch = await prisma.transaction.findFirst({
    where: {
      userId,
      source: tx.source,
      amount: {
        gte: tx.amount - AMOUNT_MATCH_THRESHOLD,
        lte: tx.amount + AMOUNT_MATCH_THRESHOLD,
      },
      categoryId: {
        not: null,
      },
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      categoryId: true,
    },
  });

  if (exactMatch?.categoryId) {
    return { categoryId: exactMatch.categoryId };
  }

  const history = await prisma.transaction.findMany({
    where: {
      userId,
      source: tx.source,
      categoryId: {
        not: null,
      },
    },
    select: {
      categoryId: true,
    },
  });

  const counts = history.reduce<Record<string, number>>((acc, record) => {
    if (!record.categoryId) {
      return acc;
    }

    acc[record.categoryId] = (acc[record.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  const popularEntry = Object.entries(counts).find(([, count]) => count >= 3);

  if (popularEntry) {
    return { categoryId: popularEntry[0] };
  }

  return { categoryId: null };
};
