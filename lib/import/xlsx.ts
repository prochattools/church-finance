import XLSX from 'xlsx';
import { buildNormalizedTransaction, extractReference } from './normalizers';
import type { ParseResult, ParsedRowError, ParsedRowSuccess } from './types';

export interface ParseXlsxOptions {
  sheetName?: string;
}

const DEFAULT_SHEET_NAME = 'transacties 2025';

export const parseInitialWorkbook = (
  buffer: Buffer,
  { sheetName = DEFAULT_SHEET_NAME }: ParseXlsxOptions = {},
): ParseResult => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return {
      successes: [],
      errors: [
        {
          rowNumber: 0,
          message: `Sheet "${sheetName}" not found`,
          raw: null,
        },
      ],
      format: 'xlsx_initial',
    };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const successes: ParsedRowSuccess[] = [];
  const errors: ParsedRowError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // account for header row

    if (!row || Object.values(row).every((value) => value == null || value === '')) {
      return;
    }

    const reference = extractReference(String(row['Notifications'] ?? '') || null);

    const result = buildNormalizedTransaction({
      rowNumber,
      accountIdentifier: row['Account'],
      accountName: (typeof row['Account'] === 'string' ? row['Account'] : null),
      currency: 'EUR',
      date: row['Date'],
      description: row['Name / Description'],
      counterparty: row['Counterparty'],
      amount: row['Amount (EUR)'],
      debitCredit: row['Debit/credit'],
      reference,
      source: 'xlsx_initial',
      raw: row as Record<string, unknown>,
    });

    if ('error' in result) {
      errors.push({
        rowNumber,
        message: result.error,
        raw: row as Record<string, unknown>,
      });
      return;
    }

    successes.push({
      ...result.result,
      rowNumber,
    });
  });

  return {
    successes,
    errors,
    format: 'xlsx_initial',
  };
};
