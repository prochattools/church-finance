import { prisma } from '../prismaClient';
import { toMinorUnits } from '../../lib/import/normalizers';
import type { Prisma } from '@prisma/client';

type ReconciliationParams = {
  userId: string;
  accountId: string;
  month?: number;
  year?: number;
  start?: string;
  end?: string;
};

type ReconciliationResult = {
  account: {
    id: string;
    name: string;
    identifier: string;
    currency: string;
  };
  period: {
    start: string;
    end: string;
    month: number;
    year: number;
  };
  ledger: {
    id: string | null;
    lockedAt: string | null;
    lockedBy: string | null;
  };
  openingBalance: {
    amountMinor: string;
    effectiveDate: string | null;
  };
  computedEndBalanceMinor: string;
  statementEndBalanceMinor: string | null;
  differenceMinor: string | null;
  status: 'balanced' | 'unreconciled' | 'unknown';
  totals: {
    creditMinor: string;
    debitMinor: string;
  };
  missingDates: string[];
  duplicateIndicators: Array<{
    date: string;
    description: string;
    amountMinor: string;
    occurrences: number;
  }>;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amountMinor: string;
    runningBalanceMinor: string;
    currency: string;
    reference: string | null;
  }>;
};

const toUTCDate = (value: string | number | Date): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
};

const truncateToUTC = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const resolvePeriod = (params: ReconciliationParams): { start: Date; end: Date; month: number; year: number } => {
  if (params.start && params.end) {
    const startDate = truncateToUTC(new Date(params.start));
    const endDate = truncateToUTC(new Date(params.end));
    const month = startDate.getUTCMonth() + 1;
    const year = startDate.getUTCFullYear();
    return { start: startDate, end: endDate, month, year };
  }

  const month = params.month ?? new Date().getUTCMonth() + 1;
  const year = params.year ?? new Date().getUTCFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end, month, year };
};

const formatISODate = (date: Date): string => date.toISOString();

const extractStatementBalance = (rawRow: Prisma.JsonValue | null | undefined): bigint | null => {
  if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
    return null;
  }

  const row = rawRow as Record<string, unknown>;
  const candidates = [
    row['Resulting balance'],
    row['resulting balance'],
    row['Saldo'],
    row['Balance'],
  ];

  for (const candidate of candidates) {
    const minor = toMinorUnits(candidate as string | number | undefined);
    if (minor != null) {
      return minor;
    }
  }

  return null;
};

const dateRange = (start: Date, end: Date): string[] => {
  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
};

export const computeReconciliation = async (
  params: ReconciliationParams,
): Promise<ReconciliationResult> => {
  const { start, end, month, year } = resolvePeriod(params);

  const account = await prisma.account.findFirst({
    where: {
      id: params.accountId,
      userId: params.userId,
    },
  });

  if (!account) {
    throw new Error('Account not found');
  }

  const ledger = await prisma.ledger.findUnique({
    where: {
      userId_month_year: {
        userId: params.userId,
        month,
        year,
      },
    },
    select: {
      id: true,
      lockedAt: true,
      lockedBy: true,
      lockNote: true,
      lock: {
        select: {
          lockedAt: true,
          lockedBy: true,
          note: true,
        },
      },
    },
  });

  const openings = await prisma.openingBalance.findMany({
    where: {
      accountId: account.id,
      effectiveDate: {
        lte: end,
      },
    },
    orderBy: {
      effectiveDate: 'asc',
    },
  });

  let openingAmount: bigint = 0n;
  let openingDate: Date | null = null;
  openings.forEach((item) => {
    if (item.effectiveDate.getTime() <= start.getTime()) {
      openingAmount = item.amountMinor;
      openingDate = item.effectiveDate;
    }
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: params.userId,
      accountId: account.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      id: true,
      date: true,
      description: true,
      amountMinor: true,
      currency: true,
      normalizedKey: true,
      reference: true,
      rawRow: true,
    },
  });

  let runningBalance = openingAmount;
  let statementBalance: bigint | null = null;
  let totalCredits = 0n;
  let totalDebits = 0n;

  const duplicateMap = new Map<string, { count: number; description: string; amount: bigint; date: string }>();
  const runningTransactions = transactions.map((tx) => {
    runningBalance += tx.amountMinor;

    if (tx.amountMinor >= 0n) {
      totalCredits += tx.amountMinor;
    } else {
      totalDebits += tx.amountMinor * -1n;
    }

    if (statementBalance === null) {
      const candidate = extractStatementBalance(tx.rawRow);
      if (candidate != null) {
        statementBalance = candidate;
      }
    }

    const dateKey = tx.date.toISOString().slice(0, 10);
    const duplicateKey = `${dateKey}|${tx.normalizedKey}|${tx.amountMinor.toString()}`;
    const existingDup = duplicateMap.get(duplicateKey);
    if (existingDup) {
      existingDup.count += 1;
    } else {
      duplicateMap.set(duplicateKey, {
        count: 1,
        description: tx.description,
        amount: tx.amountMinor,
        date: dateKey,
      });
    }

    return {
      id: tx.id,
      date: tx.date.toISOString(),
      description: tx.description,
      amountMinor: tx.amountMinor.toString(),
      runningBalanceMinor: runningBalance.toString(),
      currency: tx.currency,
      reference: tx.reference ?? null,
    };
  });

  const missingDates = dateRange(start, end).filter((iso) =>
    !transactions.some((tx) => tx.date.toISOString().startsWith(iso)),
  );

  const duplicateIndicators = Array.from(duplicateMap.values())
    .filter((entry) => entry.count > 1)
    .map((entry) => ({
      date: entry.date,
      description: entry.description,
      amountMinor: entry.amount.toString(),
      occurrences: entry.count,
    }));

  const difference = statementBalance != null ? runningBalance - statementBalance : null;

  let status: 'balanced' | 'unreconciled' | 'unknown' = 'unknown';
  if (statementBalance != null) {
    status = difference === 0n ? 'balanced' : 'unreconciled';
  }

  return {
    account: {
      id: account.id,
      name: account.name,
      identifier: account.identifier,
      currency: account.currency,
    },
    period: {
      start: formatISODate(start),
      end: formatISODate(end),
      month,
      year,
    },
    ledger: {
      id: ledger?.id ?? null,
      lockedAt: ledger?.lock?.lockedAt
        ? ledger.lock.lockedAt.toISOString()
        : ledger?.lockedAt
        ? ledger.lockedAt.toISOString()
        : null,
      lockedBy: ledger?.lock?.lockedBy ?? ledger?.lockedBy ?? null,
    },
    openingBalance: {
      amountMinor: openingAmount.toString(),
      effectiveDate: openingDate ? openingDate.toISOString() : null,
    },
    computedEndBalanceMinor: runningBalance.toString(),
    statementEndBalanceMinor: statementBalance?.toString() ?? null,
    differenceMinor: difference?.toString() ?? null,
    status,
    totals: {
      creditMinor: totalCredits.toString(),
      debitMinor: totalDebits.toString(),
    },
    missingDates,
    duplicateIndicators,
    transactions: runningTransactions,
  };
};
