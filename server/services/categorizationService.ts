import type { Prisma } from '@prisma/client';

const AMOUNT_THRESHOLD_EUROS = Number(process.env.AMOUNT_MATCH_THRESHOLD ?? 0.01);
const AMOUNT_THRESHOLD_MINOR = BigInt(
  Math.max(1, Math.round(AMOUNT_THRESHOLD_EUROS * 100)),
);

export interface CategorizationCandidate {
  userId: string;
  source: string;
  normalizedDescription: string;
  amountMinor: bigint;
  accountIdentifier: string;
}

export const categorizeTransaction = async (
  tx: Prisma.TransactionClient,
  candidate: CategorizationCandidate,
): Promise<{ categoryId: string | null }> => {
  const lowerBound = candidate.amountMinor - AMOUNT_THRESHOLD_MINOR;
  const upperBound = candidate.amountMinor + AMOUNT_THRESHOLD_MINOR;

  const exactMatch = await tx.transaction.findFirst({
    where: {
      userId: candidate.userId,
      source: candidate.source,
      amountMinor: {
        gte: lowerBound,
        lte: upperBound,
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

  const normalizedMatch = await tx.transaction.findFirst({
    where: {
      userId: candidate.userId,
      normalizedKey: candidate.normalizedDescription,
      amountMinor: {
        gte: lowerBound,
        lte: upperBound,
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

  if (normalizedMatch?.categoryId) {
    return { categoryId: normalizedMatch.categoryId };
  }

  const history = await tx.transaction.findMany({
    where: {
      userId: candidate.userId,
      source: candidate.source,
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

  const popularEntry = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count >= 3);

  if (popularEntry) {
    return { categoryId: popularEntry[0] };
  }

  return { categoryId: null };
};
