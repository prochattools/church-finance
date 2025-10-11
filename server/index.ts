import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { handleCsvUpload } from './routes/upload';
import { getLedger } from './routes/ledger';
import { getReviewTransactions, updateTransactionCategory } from './routes/review';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload', upload.single('file'), handleCsvUpload);
app.get('/api/ledger', getLedger);
app.get('/api/review', getReviewTransactions);
app.patch('/api/transactions/:id/category', updateTransactionCategory);

const port = Number(process.env.API_PORT ?? 4000);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
