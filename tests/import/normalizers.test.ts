import { describe, expect, it } from 'vitest';
import {
  toMinorUnits,
  applyDebitCredit,
  parseDate,
  normalizeDescription,
  normalizeAccountIdentifier,
} from '../../lib/import/normalizers';

describe('normalizers', () => {
  it('converts amounts with comma decimal separator to minor units', () => {
    expect(toMinorUnits('1.234,56')).toEqual(123456n);
    expect(toMinorUnits('1234.56')).toEqual(123456n);
    expect(toMinorUnits('-12,3')).toEqual(-1230n);
  });

  it('applies debit/credit markers to signed amounts', () => {
    const base = toMinorUnits('250')!;
    expect(applyDebitCredit(base, 'Credit')).toEqual(25000n);
    expect(applyDebitCredit(base, 'Debit')).toEqual(-25000n);
  });

  it('parses YYYYMMDD and DD/MM/YYYY dates into UTC dates', () => {
    const iso = parseDate('20250109');
    expect(iso?.toISOString()).toEqual('2025-01-09T00:00:00.000Z');

    const alt = parseDate('09/01/2025');
    expect(alt?.toISOString()).toEqual('2025-01-09T00:00:00.000Z');
  });

  it('normalizes descriptions and account identifiers consistently', () => {
    expect(normalizeDescription('Community Outreach Supplies!')).toEqual('community outreach supplies');
    expect(normalizeAccountIdentifier('NL89 ingb 0006 369960')).toEqual('NL89INGB0006369960');
  });
});
