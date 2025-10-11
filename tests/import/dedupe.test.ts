import { describe, expect, it } from 'vitest';
import { buildTransactionHash, attachHashes, partitionDuplicates } from '../../lib/import/dedupe';

describe('dedupe', () => {
  it('produces stable hashes for identical transactions', () => {
    const base = {
      userId: 'user-1',
      accountIdentifier: 'NL89INGB0006369960',
      date: new Date('2025-07-01T00:00:00.000Z'),
      normalizedDescription: 'monthly support gift',
      amountMinor: 25000n,
      reference: 'abc-123',
    } as const;

    const hashA = buildTransactionHash(base);
    const hashB = buildTransactionHash({ ...base });

    expect(hashA).toEqual(hashB);

    const changedReference = buildTransactionHash({ ...base, reference: 'xyz' });
    expect(changedReference).not.toEqual(hashA);
  });

  it('partitions duplicates when hashes already exist', () => {
    const successes = attachHashes('user-1', [
      {
        rowNumber: 2,
        accountIdentifier: 'NL89INGB0006369960',
        accountName: 'Test',
        currency: 'EUR',
        date: new Date('2025-06-30T00:00:00.000Z'),
        description: 'Example',
        counterparty: null,
        amountMinor: 12345n,
        reference: null,
        normalizedDescription: 'example',
        source: 'ing_csv',
        raw: {},
      },
      {
        rowNumber: 3,
        accountIdentifier: 'NL89INGB0006369960',
        accountName: 'Test',
        currency: 'EUR',
        date: new Date('2025-06-29T00:00:00.000Z'),
        description: 'Example',
        counterparty: null,
        amountMinor: 12345n,
        reference: null,
        normalizedDescription: 'example',
        source: 'ing_csv',
        raw: {},
      },
    ]);

    const existing = new Set([successes[0]!.hash]);
    const { uniques, duplicates } = partitionDuplicates(successes, existing);

    expect(duplicates).toHaveLength(1);
    expect(uniques).toHaveLength(1);
  });
});
