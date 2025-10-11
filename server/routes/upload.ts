import { Request, Response } from 'express';
import { LockedPeriodError, processImportBuffer } from '../services/importService';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';
const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const handleImportUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Import file is required.' });
  }

  if (req.file.mimetype && !ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported file type.' });
  }

  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;

  try {
    const summary = await processImportBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      userId,
    });

    return res.json(summary);
  } catch (error) {
    console.error('Import upload failed', error);
    if (error instanceof LockedPeriodError) {
      return res.status(423).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to process import file.' });
  }
};
