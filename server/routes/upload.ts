import { Request, Response } from 'express';
import { processCsvBuffer } from '../services/transactionService';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';

export const handleCsvUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required.' });
  }

  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;

  try {
    const summary = await processCsvBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      userId,
    });

    return res.json(summary);
  } catch (error) {
    console.error('CSV upload failed', error);
    return res.status(500).json({ error: 'Failed to process CSV upload.' });
  }
};
