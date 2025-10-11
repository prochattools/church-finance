import { parseString } from 'fast-csv';
import { buildNormalizedTransaction, extractReference } from './normalizers';
import type { ParseResult, ParsedRowSuccess, ParsedRowError } from './types';

const ING_DELIMITER = ';';

export const parseIngCsv = (buffer: Buffer): Promise<ParseResult> =>
  new Promise((resolve, reject) => {
    const successes: ParsedRowSuccess[] = [];
    const errors: ParsedRowError[] = [];

    let rowNumber = 1;

    parseString(buffer.toString('utf-8'), {
      headers: true,
      delimiter: ING_DELIMITER,
      trim: true,
    })
      .on('error', (error) => reject(error))
      .on('data', (row: Record<string, string>) => {
        rowNumber += 1;

        if (!row || Object.values(row).every((value) => value == null || value === '')) {
          return;
        }

        const reference = extractReference(row['Notifications'] ?? row['Notification']);
        const result = buildNormalizedTransaction({
          rowNumber,
          accountIdentifier: row['Account'],
          accountName: row['Account'] ?? null,
          currency: 'EUR',
          date: row['Date'],
          description: row['Name / Description'],
          counterparty: row['Counterparty'],
          amount: row['Amount (EUR)'],
          debitCredit: row['Debit/credit'],
          reference,
          source: 'ing_csv',
          raw: row,
        });

        if ('error' in result) {
          errors.push({
            rowNumber,
            message: result.error,
            raw: row,
          });
          return;
        }

        successes.push({
          ...result.result,
          rowNumber,
        });
      })
      .on('end', () => {
        resolve({
          successes,
          errors,
          format: 'csv_ing',
        });
      });
  });
