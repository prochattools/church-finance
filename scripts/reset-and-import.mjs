#!/usr/bin/env node
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import dotenv from "dotenv";
import xlsx from "xlsx";
import pkg from "@prisma/client";
const { PrismaClient, TransactionDirection } = pkg;

// ✅ Load environment (.env.local by default)
const envPath = process.env.ENV_FILE || ".env.local";
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

// ✅ CLI arguments
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.split("=");
    return [k.replace(/^--/, ""), rest.join("=") || ""];
  })
);

// ✅ File, range, and sheet
const file =
  args.get("file") ||
  "/Users/Steve/Documents/Development/Code/Projects/Private/church-finance/sheets/Overzicht_Yeshua_Academy_Jun_2025.xlsx";
const fromRow = Number(args.get("fromRow") || 2);
const toRow = Number(args.get("toRow") || 225);
const sheetName = "transacties 2025"; // ✅ fixed correct sheet name

// 🧮 Utilities
function parseYyyyMmDd(s) {
  const v = String(s).trim();
  if (!/^\d{8}$/.test(v)) throw new Error(`Bad date: ${s}`);
  const yyyy = Number(v.slice(0, 4));
  const mm = Number(v.slice(4, 6));
  const dd = Number(v.slice(6, 8));
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

function num(n) {
  if (n == null || n === "") return 0;
  const v = typeof n === "number" ? n : Number(String(n).replace(",", "."));
  if (Number.isNaN(v)) throw new Error(`Bad number: ${n}`);
  return v;
}

function hashString(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);
}

function normalizeKey(...parts) {
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("❌ DATABASE_URL missing from env");
  if (!fs.existsSync(file)) throw new Error(`❌ File not found: ${file}`);

  const wb = xlsx.readFile(file);
  if (!wb.Sheets[sheetName])
    throw new Error(`❌ Sheet "${sheetName}" not found in workbook`);
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });

  const header = rows[0].map((h) => (h ? String(h).trim() : ""));
  const dataRows = rows.slice(fromRow - 1, toRow);
  const expected = toRow - fromRow + 1;
  if (dataRows.length !== expected)
    throw new Error(
      `Row count mismatch: got ${dataRows.length}, expected ${expected}`
    );

  const findColumn = (...names) => {
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0) return idx;
    }
    throw new Error(
      `Missing required columns. Header: ${JSON.stringify(header)}`
    );
  };

  const iDate = findColumn("Datum", "Date");
  const iDesc = findColumn("Omschrijving", "Name / Description");
  const iAmt = findColumn("Bedrag", "Amount (EUR)");
  const iCat = findColumn("Categorie");
  const iSub = findColumn("bestemming");

  const userId = process.env.MOCK_USER_ID || "local-test";

  // ✅ Prepare 224 transaction records
  const records = dataRows.map((r, idx) => {
    const amount = num(r[iAmt]);
    const date = parseYyyyMmDd(r[iDate]);
    const description = String(r[iDesc] ?? "");
    const mainCategoryName = r[iCat] ? String(r[iCat]) : null;
    const categoryName = r[iSub] ? String(r[iSub]) : null;

    const normalizedKey = normalizeKey(
      description,
      mainCategoryName ?? "",
      categoryName ?? "",
      amount
    );

    // ✅ Include row index in hash to avoid duplicate constraint
    const hashInput = [
      idx,
      date.toISOString(),
      description,
      amount,
      mainCategoryName,
      categoryName,
      "NL89INGB0006369960",
    ].join("|");
    const hash = hashString(hashInput);

    return {
      userId,
      date,
      description,
      normalizedKey,
      amountMinor: BigInt(Math.round(amount * 100)), // Prisma BigInt
      currency: "EUR",
      direction:
        amount >= 0 ? TransactionDirection.credit : TransactionDirection.debit,
      source: "Excel Import",
      hash,
      sourceFile: path.basename(file),
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  if (records.length !== 224)
    throw new Error(`Expected 224 prepared records, got ${records.length}`);

  const prisma = new PrismaClient();
  try {
    // ✅ Ensure user exists before importing
    console.log("👤 Ensuring local-test user exists...");
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "local@test.com",
      },
    });

    console.log("🧹 Deleting all existing transactions...");
    await prisma.transaction.deleteMany({});

    console.log("🧾 First record preview:", records[0]);

    console.log(`📥 Importing ${records.length} transactions...`);
    const res = await prisma.transaction.createMany({ data: records });
    console.log(`✅ Imported ${res.count}`);

    const verify = await prisma.transaction.count();
    if (verify !== 224)
      throw new Error(`❌ Verification failed: got ${verify}, expected 224`);

    const total = await prisma.transaction.aggregate({
      _sum: { amountMinor: true },
    });
    console.log(`📊 Total EUR (minor units): ${total._sum.amountMinor ?? 0}`);
    console.log("🎉 Import complete!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Import failed:", err.message);
  process.exit(1);
});