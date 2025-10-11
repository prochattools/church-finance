import crypto from 'crypto';
import { ParsedRowSuccess } from './types';

export interface HashInput {
  userId: string;
  accountIdentifier: string;
  date: Date;
  normalizedDescription: string;
  amountMinor: bigint;
  reference?: string | null;
}

const toIso = (date: Date): string => date.toISOString();

export const buildTransactionHash = ({
  userId,
  accountIdentifier,
  date,
  normalizedDescription,
  amountMinor,
  reference,
}: HashInput): string => {
  const base = [
    userId,
    accountIdentifier.toLowerCase(),
    toIso(date),
    normalizedDescription,
    amountMinor.toString(),
    reference ? reference.toLowerCase() : '',
  ].join('|');

  return crypto.createHash('md5').update(base).digest('hex');
};

export const attachHashes = (userId: string, rows: ParsedRowSuccess[]) =>
  rows.map((row) => ({
    ...row,
    hash: buildTransactionHash({
      userId,
      accountIdentifier: row.accountIdentifier,
      date: row.date,
      normalizedDescription: row.normalizedDescription,
      amountMinor: row.amountMinor,
      reference: row.reference,
    }),
  }));

export const partitionDuplicates = <T extends { hash: string }>(
  rows: T[],
  existingHashes: Set<string>,
) => {
  const uniques: T[] = [];
  const duplicates: T[] = [];

  const seen = new Set(existingHashes);

  for (const row of rows) {
    if (seen.has(row.hash)) {
      duplicates.push(row);
      continue;
    }

    seen.add(row.hash);
    uniques.push(row);
  }

  return { uniques, duplicates };
};
