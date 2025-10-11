import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { handleImportUpload } from './routes/upload';
import { getLedger } from './routes/ledger';
import { getReviewTransactions, updateTransactionCategory } from './routes/review';
import { listAccounts, lockOpeningBalance, upsertOpeningBalance } from './routes/accounts';
import { getReconciliation } from './routes/reconciliation';
import { lockLedger, unlockLedger } from './routes/ledgers';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload', upload.single('file'), handleImportUpload);
app.get('/api/ledger', getLedger);
app.get('/api/review', getReviewTransactions);
app.patch('/api/transactions/:id/category', updateTransactionCategory);
app.get('/api/accounts', listAccounts);
app.post('/api/accounts/:accountId/opening-balance', upsertOpeningBalance);
app.post('/api/opening-balances/:balanceId/lock', lockOpeningBalance);
app.get('/api/reconciliation', getReconciliation);
app.post('/api/ledger/:ledgerId/lock', lockLedger);
app.post('/api/ledger/:ledgerId/unlock', unlockLedger);

const port = Number(process.env.API_PORT ?? 4000);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
