import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ImportSummary } from '../../lib/import/types';
import { processImportBufferWithClient } from '../../server/services/importService';

type StoredTransaction = {
  id: string;
  userId: string;
  hash: string;
  amountMinor: bigint;
  source: string;
  normalizedKey: string;
  date: Date;
  categoryId: string | null;
};

class FakePrismaClient {
  accounts: Array<{ id: string; userId: string; identifier: string; name: string; currency: string }> = [];
  ledgers: Array<{ id: string; userId: string; month: number; year: number }> = [];
  transactions: StoredTransaction[] = [];
  importBatches: Array<{ id: string; userId: string }> = [];

  async $transaction<T>(callback: (tx: ReturnType<FakePrismaClient['createTx']>) => Promise<T>): Promise<T> {
    const tx = this.createTx();
    return callback(tx);
  }

  private createTx() {
    return {
      account: {
        upsert: async ({ where, update, create }: any) => {
          const existing = this.accounts.find(
            (account) => account.userId === where.userId_identifier.userId && account.identifier === where.userId_identifier.identifier,
          );

          if (existing) {
            existing.name = update.name;
            return existing;
          }

          const record = {
            id: crypto.randomUUID(),
            userId: create.userId,
            identifier: create.identifier,
            name: create.name,
            currency: create.currency,
          };
          this.accounts.push(record);
          return record;
        },
      },
      ledger: {
        findUnique: async ({ where }: any) => {
          return this.ledgers.find(
            (ledger) =>
              ledger.userId === where.userId_month_year.userId &&
              ledger.month === where.userId_month_year.month &&
              ledger.year === where.userId_month_year.year,
          ) ?? null;
        },
        upsert: async ({ where, create }: any) => {
          const existing = this.ledgers.find(
            (ledger) =>
              ledger.userId === where.userId_month_year.userId &&
              ledger.month === where.userId_month_year.month &&
              ledger.year === where.userId_month_year.year,
          );

          if (existing) {
            return existing;
          }

          const record = {
            id: crypto.randomUUID(),
            userId: create.userId,
            month: create.month,
            year: create.year,
            lockedAt: null as Date | null,
            lockedBy: null as string | null,
          };
          this.ledgers.push(record);
          return record;
        },
        create: async ({ data }: any) => {
          const record = {
            id: crypto.randomUUID(),
            userId: data.userId,
            month: data.month,
            year: data.year,
            lockedAt: null as Date | null,
            lockedBy: null as string | null,
          };
          this.ledgers.push(record);
          return record;
        },
      },
      transaction: {
        findMany: async ({ where, select }: any) => {
          if (where?.hash?.in) {
            return this.transactions
              .filter((tx) => where.hash.in.includes(tx.hash))
              .map((tx) => ({ hash: tx.hash }));
          }

          if (where?.userId && where?.source) {
            const matches = this.transactions.filter((tx) => {
              if (tx.userId !== where.userId) return false;
              if (tx.source !== where.source) return false;
              if (where.categoryId?.not === null && tx.categoryId === null) return false;
              return true;
            });

            if (select?.categoryId) {
              return matches.map((tx) => ({ categoryId: tx.categoryId }));
            }

            return matches;
          }

          return [];
        },
        findFirst: async ({ where, orderBy, select }: any) => {
          const matches = this.transactions
            .filter((tx) => {
              if (tx.userId !== where.userId) return false;
              if (where.source && tx.source !== where.source) return false;
              if (where.normalizedKey && tx.normalizedKey !== where.normalizedKey) return false;
              if (where.categoryId?.not === null && tx.categoryId === null) return false;

              if (where.amountMinor) {
                const gte = where.amountMinor.gte as bigint;
                const lte = where.amountMinor.lte as bigint;
                if (tx.amountMinor < gte || tx.amountMinor > lte) {
                  return false;
                }
              }

              return true;
            })
            .sort((a, b) => {
              if (orderBy?.date === 'desc') {
                return b.date.getTime() - a.date.getTime();
              }
              return a.date.getTime() - b.date.getTime();
            });

          const first = matches[0];
          if (!first) return null;

          if (select?.categoryId) {
            return { categoryId: first.categoryId };
          }

          return first;
        },
        createMany: async ({ data, skipDuplicates }: any) => {
          let count = 0;
          data.forEach((entry: any) => {
            const exists = this.transactions.find((tx) => tx.hash === entry.hash);
            if (exists && skipDuplicates) {
              return;
            }
            this.transactions.push({
              id: entry.id ?? crypto.randomUUID(),
              userId: entry.userId,
              hash: entry.hash,
              amountMinor: BigInt(entry.amountMinor),
              source: entry.source,
              normalizedKey: entry.normalizedKey,
              date: entry.date instanceof Date ? entry.date : new Date(entry.date),
              categoryId: entry.categoryId ?? null,
            });
            count += 1;
          });

          return { count };
        },
      },
      importBatch: {
        create: async ({ data }: any) => {
          const record = { id: crypto.randomUUID(), userId: data.userId };
          this.importBatches.push(record);
          return record;
        },
        update: async () => undefined,
      },
    };
  }
}

const csvBuffer = fs.readFileSync(
  path.resolve(__dirname, '../../sheets/NL89INGB0006369960_2025-06-01_2025-06-30.csv'),
);

describe('import pipeline integration', () => {
  let prisma: FakePrismaClient;

  beforeEach(() => {
    prisma = new FakePrismaClient();
  });

  const runImport = (filename: string): Promise<ImportSummary> =>
    processImportBufferWithClient(prisma as any, {
      buffer: csvBuffer,
      filename,
      userId: 'demo-user',
    });

  it('imports transactions once and skips duplicates on re-import', async () => {
    const first = await runImport('statement.csv');
    expect(first.importedCount).toBeGreaterThan(0);
    expect(first.duplicateCount).toBe(0);

    const second = await runImport('statement.csv');
    expect(second.importedCount).toBe(0);
    expect(second.duplicateCount).toBeGreaterThan(0);
  });
});
