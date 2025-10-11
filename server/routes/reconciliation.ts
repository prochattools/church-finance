import { Request, Response } from 'express';
import { computeReconciliation } from '../services/reconciliationService';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';

export const getReconciliation = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;
  const accountId = req.query.accountId;

  if (typeof accountId !== 'string' || !accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const { start, end } = req.query;

  try {
    const result = await computeReconciliation({
      userId,
      accountId,
      month: Number.isFinite(month) ? month : undefined,
      year: Number.isFinite(year) ? year : undefined,
      start: typeof start === 'string' ? start : undefined,
      end: typeof end === 'string' ? end : undefined,
    });

    return res.json(result);
  } catch (error) {
    console.error('Reconciliation failed', error);
    return res.status(500).json({ error: 'Failed to compute reconciliation' });
  }
};
