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
      },
      orderBy: {
        date: 'desc',
      },
    });

    const payload = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      source: tx.source,
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
      ledgerMonth: tx.ledger?.month ?? null,
      ledgerYear: tx.ledger?.year ?? null,
    }));

    const reviewCount = payload.filter((tx) => !tx.categoryId).length;
    const totalAmount = payload.reduce((acc, tx) => acc + tx.amount, 0);

    return res.json({
      transactions: payload,
      summary: {
        total: payload.length,
        reviewCount,
        autoCategorized: payload.length - reviewCount,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Ledger fetch failed', error);
    return res.status(500).json({ error: 'Failed to load ledger.' });
  }
};
