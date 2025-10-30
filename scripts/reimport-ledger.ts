import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient, TransactionDirection, Prisma } from '@prisma/client';
import { parseInitialWorkbook } from '../lib/import/xlsx';
import { normalizeDescription } from '../lib/import/normalizers';

const prisma = new PrismaClient();

const SOURCE_ACCOUNT_IDENTIFIER = 'NL89INGB0006369960';
const SOURCE_ACCOUNT_LABEL = 'Yeshua Academy';
const WORKBOOK_PATH = path.resolve(__dirname, '../sheets/Overzicht_Yeshua_Academy_Jun_2025.xlsx');
const WORKBOOK_SHEET = 'transacties 2025';
const SOURCE_FILE_LABEL = 'Overzicht_Yeshua_Academy_Jun_2025.xlsx';

const hashRecord = (rowNumber: number, date: Date, description: string, amountMinor: bigint): string => {
  const base = `${rowNumber}|${date.toISOString()}|${description}|${amountMinor.toString()}`;
  return crypto.createHash('sha256').update(base).digest('hex');
};

const ensureUser = async (userId: string, email: string) => {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  });
};

const ensureAccount = async (userId: string, identifier: string, name: string) => {
  const account = await prisma.account.upsert({
    where: {
      userId_identifier: {
        userId,
        identifier,
      },
    },
    update: {
      name,
    },
    create: {
      userId,
      identifier,
      name,
      currency: 'EUR',
    },
  });
  return account.id;
};

const ensureLedger = async (userId: string, date: Date, cache: Map<string, string>) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const key = `${year}-${month}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const ledger = await prisma.ledger.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {},
    create: {
      userId,
      month,
      year,
    },
  });
  cache.set(key, ledger.id);
  return ledger.id;
};

const loadWorkbook = (buffer: Buffer) => {
  const parsed = parseInitialWorkbook(buffer, { sheetName: WORKBOOK_SHEET });
  if (parsed.errors.length && !parsed.successes.length) {
    const message = parsed.errors.map((err) => `Row ${err.rowNumber}: ${err.message}`).join('\n');
    throw new Error(`Failed to parse workbook:\n${message}`);
  }
  return parsed.successes;
};

const extractCategoryLabel = (raw: Record<string, unknown>): { label: string; main?: string | null } => {
  const main = typeof raw['Categorie'] === 'string' ? raw['Categorie'].trim() : null;
  const sub = typeof raw['bestemming'] === 'string' ? raw['bestemming'].trim() : null;

  if (main && sub) {
    return { label: `${main} — ${sub}`, main };
  }
  if (main) {
    return { label: main, main };
  }
  return { label: 'Ongecategoriseerd', main: null };
};

const ensureCategories = async (rows: ReturnType<typeof loadWorkbook>) => {
  const categoryMap = new Map<string, string>();
  const names = new Set<string>();

  rows.forEach((row) => {
    const raw = (row.raw ?? {}) as Record<string, unknown>;
    const { label } = extractCategoryLabel(raw);
    names.add(label);
  });

  const existing = await prisma.category.findMany({
    where: {
      name: {
        in: Array.from(names),
      },
    },
  });

  existing.forEach((category) => {
    categoryMap.set(category.name, category.id);
  });

  const missing = Array.from(names).filter((name) => !categoryMap.has(name));
  if (missing.length) {
    const created = await prisma.$transaction(
      missing.map((name) =>
        prisma.category.create({
          data: {
            name,
          },
        }),
      ),
    );
    created.forEach((category) => {
      categoryMap.set(category.name, category.id);
    });
  }

  return categoryMap;
};

async function main() {
  const userId = process.env.DEFAULT_USER_ID ?? 'demo-user';
  const email = process.env.DEFAULT_USER_EMAIL ?? `${userId}@example.com`;

  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found at ${WORKBOOK_PATH}`);
  }

  await ensureUser(userId, email);
  const accountId = await ensureAccount(userId, SOURCE_ACCOUNT_IDENTIFIER, SOURCE_ACCOUNT_LABEL);

  const buffer = fs.readFileSync(WORKBOOK_PATH);
  const rows = loadWorkbook(buffer);
  const categoryMap = await ensureCategories(rows);

  console.log(`Loaded ${rows.length} rows from workbook.`);

  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.importBatch.deleteMany({ where: { userId } });
  await prisma.ledgerLock.deleteMany({ where: { ledger: { userId } } });
  await prisma.ledger.deleteMany({ where: { userId } });

  const ledgerCache = new Map<string, string>();
  const now = new Date();

  const records: Array<{
    userId: string;
    accountId: string;
    ledgerId: string;
    date: Date;
    description: string;
    normalizedKey: string;
    amountMinor: bigint;
    currency: string;
    direction: TransactionDirection;
    source: string;
    counterparty: string | null;
    reference: string | null;
    hash: string;
    sourceFile: string;
    rawRow: Prisma.InputJsonValue;
    categoryId: string;
    classificationSource: 'manual';
    classificationRuleId: null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const row of rows) {
    const raw = (row.raw ?? {}) as Record<string, unknown>;
    const { label: categoryLabel, main: mainCategory } = extractCategoryLabel(raw);
    const categoryId = categoryMap.get(categoryLabel);
    if (!categoryId) {
      throw new Error(`Missing category mapping for "${categoryLabel}"`);
    }

    const ledgerId = await ensureLedger(userId, row.date, ledgerCache);
    const direction: TransactionDirection = row.amountMinor >= 0n ? 'credit' : 'debit';

    const rawPayload: Prisma.InputJsonValue = {
      ...raw,
      mainCategoryName: mainCategory,
      categoryName: categoryLabel,
    };

    records.push({
      userId,
      accountId,
      ledgerId,
      date: row.date,
      description: row.description,
      normalizedKey: normalizeDescription(row.description),
      amountMinor: row.amountMinor,
      currency: row.currency,
      direction,
      source: 'Excel Initial Load',
      counterparty: row.counterparty,
      reference: row.reference,
      hash: hashRecord(row.rowNumber, row.date, row.description, row.amountMinor),
      sourceFile: SOURCE_FILE_LABEL,
      rawRow: rawPayload,
      categoryId,
      classificationSource: 'manual',
      classificationRuleId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await prisma.transaction.createMany({
    data: records,
    skipDuplicates: false,
  });

  console.log(`Transactions after import: ${records.length}`);
}

main()
  .catch((error) => {
    console.error('Re-import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
