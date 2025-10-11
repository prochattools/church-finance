import { parseString } from 'fast-csv';
import { ParsedTransaction } from '../types';

export const normalizeDescription = (description: string): string =>
  description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const parseTransactions = (buffer: Buffer): Promise<ParsedTransaction[]> =>
  new Promise((resolve, reject) => {
    const rows: ParsedTransaction[] = [];

    parseString(buffer.toString('utf-8'), { headers: true, trim: true })
      .on('error', reject)
      .on('data', (row: Record<string, string>) => {
        const rawDate = row.date ?? row.Date ?? row.transactionDate;
        const rawDescription = row.description ?? row.Description ?? row.memo ?? '';
        const rawAmount = row.amount ?? row.Amount ?? row.transactionAmount;
        const rawSource = row.source ?? row.Source ?? row.merchant ?? rawDescription;

        if (!rawDate || !rawDescription || !rawAmount) {
          return;
        }

        const amount = Number(rawAmount.replace(/[^0-9-.,]/g, '').replace(',', '.'));
        const date = new Date(rawDate);

        if (Number.isNaN(amount) || Number.isNaN(date.getTime())) {
          return;
        }

        rows.push({
          date,
          description: rawDescription,
          amount,
          source: rawSource,
          normalizedKey: normalizeDescription(rawDescription),
        });
      })
      .on('end', () => resolve(rows));
  });
