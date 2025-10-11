import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';

export const getReviewTransactions = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;

  try {
    const [transactions, categories] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          categoryId: null,
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return res.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        source: tx.source,
      })),
      categories,
    });
  } catch (error) {
    console.error('Review fetch failed', error);
    return res.status(500).json({ error: 'Failed to load review queue.' });
  }
};

export const updateTransactionCategory = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;
  const transactionId = req.params.id;
  const { categoryId, categoryName } = req.body as {
    categoryId?: string | null;
    categoryName?: string;
  };

  try {
    const tx = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    let finalCategoryId = categoryId ?? null;

    if (!finalCategoryId && categoryName) {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });

      finalCategoryId = category.id;
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId: finalCategoryId },
      include: {
        category: true,
      },
    });

    return res.json({
      id: updated.id,
      categoryId: updated.categoryId,
      categoryName: updated.category?.name ?? null,
    });
  } catch (error) {
    console.error('Category update failed', error);
    return res.status(500).json({ error: 'Failed to update category.' });
  }
};
