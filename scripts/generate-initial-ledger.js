#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const workbookPath = path.resolve(__dirname, '../sheets/Overzicht_Yeshua_Academy_Jun_2025.xlsx');
const outputPath = path.resolve(__dirname, '../src/data/initial-ledger.json');
const sheetName = 'transacties 2025';

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';

const parseDate = (input) => {
  if (input == null) return null;
  if (typeof input === 'number') {
    const str = String(input);
    if (str.length === 8) {
      const year = Number(str.slice(0, 4));
      const month = Number(str.slice(4, 6)) - 1;
      const day = Number(str.slice(6, 8));
      return new Date(Date.UTC(year, month, day));
    }
  }
  const text = String(input).trim();
  if (!text) return null;
  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));
    return new Date(Date.UTC(year, month, day));
  }
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(text)) {
    const [d, m, y] = text.replace(/-/g, '/').split('/');
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseAmount = (value, debitCredit) => {
  if (value == null) return null;
  const normalized = String(value).replace(/[^0-9-.,]/g, '').replace('.', '').replace(',', '.');
  if (!normalized) return null;
  const amount = Number(normalized);
  if (Number.isNaN(amount)) return null;
  if (typeof debitCredit === 'string' && debitCredit.toLowerCase() === 'debit') {
    return amount * -1;
  }
  return amount;
};

const workbook = XLSX.readFile(workbookPath);
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.error(`Sheet "${sheetName}" not found in workbook.`);
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

const categories = new Map();
const subcategories = new Map();
const transactions = [];

const addCategory = (name) => {
  if (!name) return null;
  if (!categories.has(name)) {
    categories.set(name, {
      id: `cat-${slugify(name)}`,
      name,
      parentId: null,
    });
  }
  return categories.get(name);
};

const addSubcategory = (main, sub) => {
  if (!main || !sub) return null;
  const key = `${main}__${sub}`;
  if (!subcategories.has(key)) {
    const parent = addCategory(main);
    subcategories.set(key, {
      id: `sub-${slugify(main)}-${slugify(sub)}`,
      name: sub,
      parentId: parent.id,
    });
  }
  return subcategories.get(key);
};

for (const row of rows) {
  const date = parseDate(row.Date ?? row['Date']);
  const description = row['Name / Description'];
  const amount = parseAmount(row['Amount (EUR)'], row['Debit/credit']);
  const source = row.Counterparty ?? row['Name / Description'];
  const mainCategoryName = row.Categorie;
  const subCategoryName = row.bestemming ?? row['bestemming'];

  if (!date || !description || amount == null) {
    continue;
  }

  const mainCategory = mainCategoryName ? addCategory(String(mainCategoryName).trim()) : null;
  const subCategory =
    mainCategory && subCategoryName
      ? addSubcategory(String(mainCategoryName).trim(), String(subCategoryName).trim())
      : null;

  transactions.push({
    id: `tx-${transactions.length + 1}`,
    date: date.toISOString(),
    description: String(description).trim(),
    amount,
    source: source ? String(source).trim() : '',
    normalizedKey: String(description ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(),
    categoryId: subCategory ? subCategory.id : mainCategory ? mainCategory.id : null,
    categoryName: subCategory ? subCategory.name : mainCategory ? mainCategory.name : null,
    mainCategoryId: mainCategory ? mainCategory.id : null,
    createdAt: new Date().toISOString(),
    autoCategorized: true,
  });
}

const categoryList = Array.from(categories.values()).concat(Array.from(subcategories.values()));

const payload = {
  generatedAt: new Date().toISOString(),
  categories: categoryList,
  transactions,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Saved ${transactions.length} transactions and ${categoryList.length} categories to ${outputPath}`);
