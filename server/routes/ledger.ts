import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';

export const getLedger = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        ledger: true,
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const accountIds = Array.from(
      new Set(transactions.map((tx) => tx.accountId).filter((value): value is string => Boolean(value))),
    );

    const openingBalances = accountIds.length
      ? await prisma.openingBalance.findMany({
          where: {
            accountId: {
              in: accountIds,
            },
          },
          orderBy: {
            effectiveDate: 'asc',
          },
        })
      : [];

    const openingsByAccount = openingBalances.reduce<Record<string, typeof openingBalances>>((acc, item) => {
      if (!acc[item.accountId]) {
        acc[item.accountId] = [];
      }
      acc[item.accountId].push(item);
      return acc;
    }, {});

    const transactionsByAccount = new Map<string | null, typeof transactions>();
    transactions.forEach((tx) => {
      const key = tx.accountId ?? null;
      const list = transactionsByAccount.get(key) ?? [];
      list.push(tx);
      transactionsByAccount.set(key, list);
    });

    const runningBalanceById = new Map<string, bigint>();

    transactionsByAccount.forEach((list, accountId) => {
      const sorted = [...list].sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const openings = accountId ? openingsByAccount[accountId] ?? [] : [];
      let openingIndex = 0;
      let currentBalance: bigint | null = null;

      sorted.forEach((tx) => {
        const txDate = new Date(tx.date);
        while (
          openings[openingIndex] &&
          openings[openingIndex]!.effectiveDate.getTime() <= txDate.getTime()
        ) {
          currentBalance = openings[openingIndex]!.amountMinor;
          openingIndex += 1;
        }

        if (currentBalance === null) {
          currentBalance = 0n;
        }

        currentBalance += tx.amountMinor;
        runningBalanceById.set(tx.id, currentBalance);
      });
    });

    const payload = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: Number(tx.amountMinor) / 100,
      amountMinor: tx.amountMinor.toString(),
      currency: tx.currency,
      direction: tx.direction,
      source: tx.source,
      counterparty: tx.counterparty,
      reference: tx.reference,
      accountLabel: tx.account?.name ?? null,
      accountIdentifier: tx.account?.identifier ?? null,
      sourceFile: tx.sourceFile,
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
      ledgerMonth: tx.ledger?.month ?? null,
      ledgerYear: tx.ledger?.year ?? null,
      createdAt: tx.createdAt,
      runningBalanceMinor: runningBalanceById.get(tx.id)?.toString() ?? null,
      runningBalance: runningBalanceById.has(tx.id)
        ? Number(runningBalanceById.get(tx.id)) / 100
        : null,
    }));

    const reviewCount = payload.filter((tx) => !tx.categoryId).length;
    const totalAmountMinor = transactions.reduce((acc, tx) => acc + Number(tx.amountMinor), 0);
    const totalAmount = totalAmountMinor / 100;
    const autoCategorized = payload.length - reviewCount;

    return res.json({
      transactions: payload,
      summary: {
        total: payload.length,
        reviewCount,
        autoCategorized,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Ledger fetch failed', error);
    return res.status(500).json({ error: 'Failed to load ledger.' });
  }
};
