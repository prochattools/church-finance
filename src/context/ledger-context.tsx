'use client';

import Papa, { ParseResult } from 'papaparse';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import initialLedger from '@/data/initial-ledger.json';

type AccountLabelEntry = {
  keys: string[];
  label: string;
  altLabel?: string;
  altPattern?: RegExp;
  identifier?: string;
};

const ACCOUNT_LABEL_ENTRIES: AccountLabelEntry[] = [
  {
    keys: ['NL89INGB0006369960'],
    label: 'Yeshua Academy',
    identifier: 'NL89INGB0006369960',
    altLabel: 'Vila Solidária',
    altPattern: /VILA|SOLIDARIA/i,
  },
  {
    keys: ['R 951-98945', 'R95198945'],
    label: 'Fellowship Renswoude',
    identifier: 'R 951-98945',
  },
  {
    keys: ['K 577-97642', 'K57797642'],
    label: 'Fellowship Veluwe',
    identifier: 'K 577-97642',
  },
  {
    keys: ['C 951-98936', 'C95198936'],
    label: 'Fellowship Barneveld',
    identifier: 'C 951-98936',
  },
  {
    keys: ['F 951-98948', 'F95198948'],
    label: 'Yeshua Academy Savings',
    identifier: 'F 951-98948',
  },
];

const normalizeAccountKey = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();

const ACCOUNT_LABEL_LOOKUP: Map<string, AccountLabelEntry> = ACCOUNT_LABEL_ENTRIES.reduce(
  (acc, entry) => {
    entry.keys.forEach((key) => acc.set(normalizeAccountKey(key), entry));
    return acc;
  },
  new Map<string, AccountLabelEntry>(),
);

const resolveAccountMetadata = (
  rawValue: string | null | undefined,
): { label: string | null; identifier: string | null } => {
  if (!rawValue) {
    return { label: null, identifier: null };
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { label: null, identifier: null };
  }

  const normalized = normalizeAccountKey(trimmed);
  let entry = ACCOUNT_LABEL_LOOKUP.get(normalized);
  if (!entry) {
    for (const candidate of ACCOUNT_LABEL_ENTRIES) {
      if (candidate.keys.some((key) => normalized.includes(normalizeAccountKey(key)))) {
        entry = candidate;
        break;
      }
    }
  }
  if (!entry) {
    return { label: null, identifier: null };
  }

  let label = entry.label;
  if (
    entry.altLabel &&
    entry.altPattern &&
    (entry.altPattern.test(trimmed) || entry.altPattern.test(normalized))
  ) {
    label = entry.altLabel;
  }

  return {
    label,
    identifier: entry.identifier ?? trimmed,
  };
};

type UUID = string;

type RawCategory = {
  id: string;
  name: string;
  parentId: string | null;
};

type RawTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  source: string;
  accountLabel?: string | null;
  accountIdentifier?: string | null;
  normalizedKey?: string;
  notificationDetail?: string | null;
  categoryId: string | null;
  categoryName: string | null;
  mainCategoryId: string | null;
  mainCategoryName?: string | null;
  createdAt: string;
  autoCategorized?: boolean;
  needsManualCategory?: boolean;
};

type InitialLedgerFile = {
  categories: RawCategory[];
  transactions: RawTransaction[];
};

export interface Category {
  id: UUID;
  name: string;
  parentId: UUID | null;
  color?: string | null;
}

export interface LedgerTransaction {
  id: UUID;
  date: string; // ISO
  description: string;
  amount: number;
  source: string;
  accountLabel: string | null;
  accountIdentifier: string | null;
  normalizedKey: string;
  notificationDetail: string | null;
  categoryId: UUID | null;
  categoryName: string | null;
  mainCategoryId: UUID | null;
  mainCategoryName: string | null;
  ledgerMonth: number;
  ledgerYear: number;
  createdAt: string;
  autoCategorized: boolean;
  needsManualCategory: boolean;
}

interface ImportSummary {
  importedCount: number;
  autoCategorized: number;
  reviewCount: number;
}

interface LedgerState {
  transactions: LedgerTransaction[];
  categories: Category[];
}

export interface CategoryTree {
  main: Category[];
  byParent: Record<string, Category[]>;
}

interface LedgerContextValue {
  transactions: LedgerTransaction[];
  categories: Category[];
  categoryTree: CategoryTree;
  summary: {
    total: number;
    reviewCount: number;
    autoCategorized: number;
    totalAmount: number;
  };
  reviewTransactions: LedgerTransaction[];
  importCsv: (file: File) => Promise<ImportSummary>;
  assignCategory: (
    transactionId: UUID,
    options: { categoryId?: UUID | null; mainCategoryId?: UUID | null; categoryName?: string }
  ) => Promise<void>;
  clearAll: () => void;
}

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

const STORAGE_KEY = 'ledger-mvp-state-v2';

const COLOR_PALETTE = ['#4C6EF5', '#15AABF', '#40C057', '#FCC419', '#FF6B6B', '#7950F2', '#F06595', '#20C997'];

const REVIEW_MAIN_CATEGORY: Category = {
  id: 'cat-review',
  name: 'Review',
  parentId: null,
  color: '#FF922B',
};

const REVIEW_SUB_CATEGORY: Category = {
  id: 'sub-review-needs-category',
  name: 'Needs manual categorization',
  parentId: REVIEW_MAIN_CATEGORY.id,
  color: '#FFA94D',
};

const normaliseDescription = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}-${Math.random()}`;

const parseDateString = (value: string): Date | null => {
  const trimmed = value.trim();

  if (/^\d{8}$/.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6)) - 1;
    const day = Number(trimmed.slice(6, 8));
    return new Date(Date.UTC(year, month, day));
  }

  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.replace(/-/g, '/').split('/');
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseAmount = (value: string, debitCredit?: string): number | null => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/\u00A0/g, '').replace(/[^0-9.,-]/g, '');
  if (!cleaned) return null;

  const dotCount = (cleaned.match(/\./g) ?? []).length;
  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized: string;

  if (commaCount > 0 && (dotCount === 0 || lastComma > lastDot)) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (dotCount > 0 && commaCount === 0) {
    if (dotCount > 1) {
      normalized = cleaned.replace(/\./g, '');
    } else {
      const decimals = cleaned.length - lastDot - 1;
      normalized = decimals === 3 ? cleaned.replace(/\./g, '') : cleaned;
    }
  } else if (dotCount > 0 && commaCount > 0 && lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, '');
  } else {
    normalized = cleaned.replace(/[.,]/g, '');
  }

  normalized = normalized.replace(/(?!^)-/g, '');

  if (!normalized || normalized === '-' || normalized === '.') return null;

  const amount = Number(normalized);
  if (Number.isNaN(amount)) return null;

  const indicator = debitCredit?.trim().toLowerCase();
  if (indicator && (indicator.startsWith('debit') || indicator === 'af' || indicator === 'd')) {
    return amount * -1;
  }

  return amount;
};

const sanitizeNotification = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.replace(/^Name:\s*/i, '').trim();
  return withoutPrefix.length ? withoutPrefix : null;
};

type ParsedRow = {
  [key: string]: string | undefined;
  date?: string;
  Date?: string;
  transactionDate?: string;
  description?: string;
  Description?: string;
  memo?: string;
  amount?: string;
  Amount?: string;
  transactionAmount?: string;
  source?: string;
  Source?: string;
  merchant?: string;
  'Name / Description'?: string;
  Counterparty?: string;
  'Counter Party'?: string;
  'Debit/credit'?: string;
  'Debit Credit'?: string;
  'Amount (EUR)'?: string;
  'Booking date'?: string;
  Notifications?: string;
  notifications?: string;
};

type CategorySuggestion = {
  categoryId: UUID | null;
  categoryName: string | null;
  mainCategoryId: UUID | null;
  mainCategoryName: string | null;
};

type SuggestionRecord = {
  suggestion: CategorySuggestion;
  count: number;
  lastSeen: number;
};

type SuggestionHistory = Map<string, Map<string, SuggestionRecord>>;

const parseCsvFile = (file: File): Promise<ParsedRow[]> =>
  new Promise((resolve, reject) => {
    const runParse = (delimiter?: string) => {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        delimiter,
        complete: (results: ParseResult<ParsedRow>) => {
          const rows = results.data ?? [];
          if (!rows.length && delimiter === undefined) {
            runParse(';');
          } else {
            resolve(rows);
          }
        },
        error: (error) => reject(error),
      });
    };

    runParse();
  });

const buildTransactionFromRow = (row: ParsedRow): Omit<LedgerTransaction, 'categoryId' | 'categoryName' | 'mainCategoryId' | 'mainCategoryName' | 'autoCategorized' | 'needsManualCategory'> | null => {
  const rawDate = row.date ?? row.Date ?? row.transactionDate ?? row['Booking date'] ?? row['Date'];
  const rawDescription =
    row['Name / Description'] ?? row.description ?? row.Description ?? row.memo ?? row['Description'];
  const rawAmount = row['Amount (EUR)'] ?? row.amount ?? row.Amount ?? row.transactionAmount ?? row['Amount'];
  const rawSource =
    row.Counterparty ?? row['Counter Party'] ?? row.source ?? row.Source ?? row.merchant ?? rawDescription;
  const rawDebitCredit = row['Debit/credit'] ?? row['Debit Credit'];
  const notificationDetail = sanitizeNotification(row.Notifications ?? row.notifications);

  if (!rawDate || !rawDescription || !rawAmount) {
    return null;
  }

  const parsedDate = parseDateString(String(rawDate));
  const amount = parseAmount(String(rawAmount), rawDebitCredit);

  if (!parsedDate || amount === null) {
    return null;
  }

  const normalizedKey = normaliseDescription(String(rawDescription));
  const sourceValue = (rawSource ?? rawDescription).trim();
  const { label: accountLabel, identifier: accountIdentifier } = resolveAccountMetadata(rawSource ?? rawDescription);

  return {
    id: createId(),
    date: parsedDate.toISOString(),
    description: String(rawDescription).trim(),
    amount,
    source: sourceValue,
    accountLabel: accountLabel ?? null,
    accountIdentifier: accountLabel ? accountIdentifier ?? sourceValue : null,
    normalizedKey,
    notificationDetail,
    ledgerMonth: parsedDate.getUTCMonth() + 1,
    ledgerYear: parsedDate.getUTCFullYear(),
    createdAt: new Date().toISOString(),
  };
};

const hydrateCategory = (raw: RawCategory, index: number): Category => ({
  id: raw.id,
  name: raw.name,
  parentId: raw.parentId,
  color: COLOR_PALETTE[index % COLOR_PALETTE.length],
});

const ensureCategoryIndex = (categories: Category[]): { map: Map<string, Category>; tree: CategoryTree } => {
  const map = new Map<string, Category>();
  const byParent: Record<string, Category[]> = {};

  categories.forEach((category) => {
    map.set(category.id, category);
    if (category.parentId) {
      if (!byParent[category.parentId]) {
        byParent[category.parentId] = [];
      }
      byParent[category.parentId].push(category);
    }
  });

  const main = categories.filter((cat) => !cat.parentId).sort((a, b) => a.name.localeCompare(b.name));
  Object.values(byParent).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

  return {
    map,
    tree: {
      main,
      byParent,
    },
  };
};

const deriveMainCategory = (categoryId: string | null, categoryIndex: Map<string, Category>): Category | null => {
  if (!categoryId) return null;
  const category = categoryIndex.get(categoryId);
  if (!category) return null;
  if (!category.parentId) {
    return category;
  }
  return categoryIndex.get(category.parentId) ?? null;
};

const hydrateTransaction = (
  raw: RawTransaction,
  categoryIndex: Map<string, Category>,
): LedgerTransaction => {
  const date = new Date(raw.date);
  const ledgerMonth = Number.isNaN(date.getTime()) ? 1 : date.getUTCMonth() + 1;
  const ledgerYear = Number.isNaN(date.getTime()) ? new Date().getUTCFullYear() : date.getUTCFullYear();

  const category = raw.categoryId ? categoryIndex.get(raw.categoryId) ?? null : null;
  const mainCategory = raw.mainCategoryId
    ? categoryIndex.get(raw.mainCategoryId) ?? null
    : deriveMainCategory(raw.categoryId, categoryIndex);
  const resolvedAccount = resolveAccountMetadata(raw.source);
  const accountLabel = raw.accountLabel ?? resolvedAccount.label ?? null;
  const accountIdentifier =
    raw.accountIdentifier ??
    (accountLabel ? resolvedAccount.identifier ?? raw.source ?? null : null);

  return {
    id: raw.id,
    date: raw.date,
    description: raw.description,
    amount: raw.amount,
    source: raw.source,
    accountLabel,
    accountIdentifier: accountIdentifier ?? null,
    normalizedKey: raw.normalizedKey ?? normaliseDescription(raw.description),
    notificationDetail: raw.notificationDetail ?? null,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName ?? category?.name ?? null,
    mainCategoryId: mainCategory?.id ?? null,
    mainCategoryName: raw.mainCategoryName ?? mainCategory?.name ?? null,
    ledgerMonth,
    ledgerYear,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    autoCategorized: Boolean(raw.autoCategorized),
    needsManualCategory: Boolean(raw.needsManualCategory) && !raw.autoCategorized,
  };
};

const prepareInitialState = (): LedgerState => {
  const file = initialLedger as InitialLedgerFile;
  const baseCategories = file.categories.map(hydrateCategory);
  const mergedCategories = [...baseCategories, REVIEW_MAIN_CATEGORY, REVIEW_SUB_CATEGORY];

  const { map } = ensureCategoryIndex(mergedCategories);

  const transactions = file.transactions.map((tx) => hydrateTransaction(tx, map));

  return {
    categories: mergedCategories,
    transactions,
  };
};

const DEFAULT_STATE: LedgerState = prepareInitialState();

const mergeStoredState = (stored: Partial<LedgerState> | null): LedgerState => {
  if (!stored) {
    return DEFAULT_STATE;
  }

  const categories = [...DEFAULT_STATE.categories];
  const seen = new Set(categories.map((cat) => cat.id));

  (stored.categories ?? []).forEach((category) => {
    if (!seen.has(category.id)) {
      seen.add(category.id);
      categories.push(category);
    }
  });

  const { map } = ensureCategoryIndex(categories);
  const transactions = (stored.transactions ?? DEFAULT_STATE.transactions).map((tx) => ({
    ...hydrateTransaction(
      {
        ...tx,
        mainCategoryId: tx.mainCategoryId ?? null,
        categoryName: tx.categoryName ?? null,
        normalizedKey: tx.normalizedKey ?? normaliseDescription(tx.description),
        notificationDetail: (tx as Partial<LedgerTransaction>).notificationDetail ?? null,
        needsManualCategory: (tx as Partial<LedgerTransaction>).needsManualCategory,
      },
      map,
    ),
    autoCategorized: Boolean(tx.autoCategorized),
    needsManualCategory: Boolean((tx as Partial<LedgerTransaction>).needsManualCategory),
  }));

  return { categories, transactions };
};

const loadState = (): LedgerState => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(storedRaw) as Partial<LedgerState>;
    return mergeStoredState(parsed);
  } catch (error) {
    console.error('Failed to load ledger state', error);
    return DEFAULT_STATE;
  }
};

const persistState = (state: LedgerState) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist ledger state', error);
  }
};

const sanitizeKey = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
};

const makeDirectHistoryKey = (source: string | null | undefined, amount: number): string | null => {
  if (!source && source !== '') return null;
  const normalizedSource = sanitizeKey(source ?? '');
  if (!normalizedSource) return null;
  return `${normalizedSource}|${amount}`;
};

const suggestionIdentifier = (suggestion: CategorySuggestion): string =>
  `${suggestion.mainCategoryId ?? 'null'}::${suggestion.categoryId ?? 'null'}`;

const ensureSuggestionNames = (
  suggestion: CategorySuggestion,
  categoryIndex: Map<string, Category>,
): CategorySuggestion => {
  let { categoryId, categoryName, mainCategoryId, mainCategoryName } = suggestion;

  if (categoryId) {
    const category = categoryIndex.get(categoryId);
    categoryName = categoryName ?? category?.name ?? null;
    if (!mainCategoryId && category?.parentId) {
      mainCategoryId = category.parentId;
    }
  }

  if (mainCategoryId) {
    const mainCategory = categoryIndex.get(mainCategoryId);
    mainCategoryName = mainCategoryName ?? mainCategory?.name ?? null;
  }

  if (!categoryId && !mainCategoryId) {
    return {
      categoryId: null,
      categoryName: null,
      mainCategoryId: null,
      mainCategoryName: null,
    };
  }

  return {
    categoryId,
    categoryName: categoryName ?? null,
    mainCategoryId,
    mainCategoryName: mainCategoryName ?? null,
  };
};

const registerSuggestion = (
  history: SuggestionHistory,
  key: string | null,
  suggestion: CategorySuggestion,
  order: number,
) => {
  if (!key) return;
  const bucket = history.get(key) ?? new Map<string, SuggestionRecord>();
  const recordKey = suggestionIdentifier(suggestion);
  const record = bucket.get(recordKey);
  if (record) {
    record.count += 1;
    record.lastSeen = order;
  } else {
    bucket.set(recordKey, {
      suggestion,
      count: 1,
      lastSeen: order,
    });
  }
  history.set(key, bucket);
};

const pickBestSuggestion = (history: SuggestionHistory, key: string | null): CategorySuggestion | null => {
  if (!key) return null;
  const bucket = history.get(key);
  if (!bucket) return null;

  let best: SuggestionRecord | null = null;
  bucket.forEach((record) => {
    if (!best) {
      best = record;
      return;
    }
    if (record.count > best.count) {
      best = record;
      return;
    }
    if (record.count === best.count && record.lastSeen > best.lastSeen) {
      best = record;
    }
  });

  if (!best) return null;
  const { suggestion } = best;
  return {
    categoryId: suggestion.categoryId,
    categoryName: suggestion.categoryName,
    mainCategoryId: suggestion.mainCategoryId,
    mainCategoryName: suggestion.mainCategoryName,
  };
};

const buildSuggestionFromTransaction = (
  tx: LedgerTransaction,
  categoryIndex: Map<string, Category>,
): CategorySuggestion | null => {
  const suggestion = ensureSuggestionNames(
    {
      categoryId: tx.categoryId,
      categoryName: tx.categoryName,
      mainCategoryId: tx.mainCategoryId,
      mainCategoryName: tx.mainCategoryName,
    },
    categoryIndex,
  );

  if (!suggestion.categoryId && !suggestion.mainCategoryId) {
    return null;
  }

  return suggestion;
};

const categorizeTransactions = (
  incoming: LedgerTransaction[],
  history: LedgerTransaction[],
  categoryIndex: Map<string, Category>,
): { transactions: LedgerTransaction[]; autoCategorized: number } => {
  let autoCategorized = 0;
  let sequence = 0;

  const nextOrder = () => {
    sequence += 1;
    return sequence;
  };

  const sourceHistory: SuggestionHistory = new Map();
  const descriptionHistory: SuggestionHistory = new Map();
  const directHistory: SuggestionHistory = new Map();
  const overallHistory: SuggestionHistory = new Map();

  const recordTransaction = (tx: LedgerTransaction) => {
    const suggestion = buildSuggestionFromTransaction(tx, categoryIndex);
    if (!suggestion) {
      return;
    }

    const normalizedSuggestion = ensureSuggestionNames(suggestion, categoryIndex);

    if (normalizedSuggestion.mainCategoryId === REVIEW_MAIN_CATEGORY.id) {
      return;
    }

    const order = nextOrder();

    registerSuggestion(
      directHistory,
      makeDirectHistoryKey(tx.source, tx.amount),
      normalizedSuggestion,
      order,
    );
    registerSuggestion(sourceHistory, sanitizeKey(tx.source), normalizedSuggestion, order);
    registerSuggestion(descriptionHistory, sanitizeKey(tx.normalizedKey), normalizedSuggestion, order);
    registerSuggestion(overallHistory, '__overall__', normalizedSuggestion, order);
  };

  history.forEach(recordTransaction);

  const results = incoming.map((tx) => {
    const directKey = makeDirectHistoryKey(tx.source, tx.amount);
    const directSuggestion = pickBestSuggestion(directHistory, directKey);

    if (directSuggestion) {
      const normalized = ensureSuggestionNames(directSuggestion, categoryIndex);
      const enriched: LedgerTransaction = {
        ...tx,
        categoryId: normalized.categoryId,
        categoryName: normalized.categoryName,
        mainCategoryId: normalized.mainCategoryId,
        mainCategoryName: normalized.mainCategoryName,
        autoCategorized: true,
        needsManualCategory: false,
      };
      autoCategorized += 1;
      recordTransaction(enriched);
      return enriched;
    }

    const fallbackSuggestion =
      pickBestSuggestion(sourceHistory, sanitizeKey(tx.source)) ??
      pickBestSuggestion(descriptionHistory, sanitizeKey(tx.normalizedKey)) ??
      pickBestSuggestion(overallHistory, '__overall__');

    if (fallbackSuggestion) {
      const normalized = ensureSuggestionNames(fallbackSuggestion, categoryIndex);
      return {
        ...tx,
        categoryId: normalized.categoryId,
        categoryName: normalized.categoryName,
        mainCategoryId: normalized.mainCategoryId,
        mainCategoryName: normalized.mainCategoryName,
        autoCategorized: false,
        needsManualCategory: true,
      };
    }

    return {
      ...tx,
      categoryId: REVIEW_SUB_CATEGORY.id,
      categoryName: REVIEW_SUB_CATEGORY.name,
      mainCategoryId: REVIEW_MAIN_CATEGORY.id,
      mainCategoryName: REVIEW_MAIN_CATEGORY.name,
      autoCategorized: false,
      needsManualCategory: true,
    };
  });

  return { transactions: results, autoCategorized };
};

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LedgerState>(DEFAULT_STATE);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state]);

  const { map: categoryIndex, tree: categoryTree } = useMemo(
    () => ensureCategoryIndex(state.categories),
    [state.categories],
  );

  const summary = useMemo(() => {
    const reviewCount = state.transactions.filter((tx) => tx.needsManualCategory).length;
    const autoCategorized = state.transactions.filter((tx) => tx.autoCategorized).length;
    const totalAmount = state.transactions.reduce((acc, tx) => acc + tx.amount, 0);

    return {
      total: state.transactions.length,
      reviewCount,
      autoCategorized,
      totalAmount,
    };
  }, [state.transactions]);

  const reviewTransactions = useMemo(
    () => state.transactions.filter((tx) => tx.needsManualCategory),
    [state.transactions],
  );

  const importCsv = useCallback(
    async (file: File): Promise<ImportSummary> => {
      const rows = await parseCsvFile(file);
      const prepared = rows
        .map(buildTransactionFromRow)
        .filter((tx): tx is NonNullable<ReturnType<typeof buildTransactionFromRow>> => Boolean(tx));

      if (!prepared.length) {
        return { importedCount: 0, autoCategorized: 0, reviewCount: 0 };
      }

      const existingKeys = new Set(
        state.transactions.map((tx) => `${tx.date}|${tx.amount}|${tx.normalizedKey}`),
      );

      const uniqueIncoming = prepared.filter((tx) => {
        const key = `${tx.date}|${tx.amount}|${tx.normalizedKey}`;
        if (existingKeys.has(key)) {
          return false;
        }
        existingKeys.add(key);
        return true;
      });

      if (!uniqueIncoming.length) {
        return { importedCount: 0, autoCategorized: 0, reviewCount: 0 };
      }

      const normalized = uniqueIncoming.map<LedgerTransaction>((tx) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        source: tx.source,
        accountLabel: tx.accountLabel,
        accountIdentifier: tx.accountIdentifier,
        normalizedKey: tx.normalizedKey,
        notificationDetail: tx.notificationDetail ?? null,
        ledgerMonth: tx.ledgerMonth,
        ledgerYear: tx.ledgerYear,
        createdAt: tx.createdAt,
        categoryId: null,
        categoryName: null,
        mainCategoryId: null,
        mainCategoryName: null,
        autoCategorized: false,
        needsManualCategory: true,
      }));

      const { transactions: categorized, autoCategorized } = categorizeTransactions(
        normalized,
        state.transactions,
        categoryIndex,
      );

      setState((current) => ({
        ...current,
        transactions: [...categorized, ...current.transactions],
      }));

      const reviewCount = categorized.filter((tx) => tx.needsManualCategory).length;

      return {
        importedCount: categorized.length,
        autoCategorized,
        reviewCount,
      };
    },
    [state.transactions, categoryIndex],
  );

  const assignCategory = useCallback(
    async (
      transactionId: UUID,
      { categoryId, mainCategoryId, categoryName }: { categoryId?: UUID | null; mainCategoryId?: UUID | null; categoryName?: string },
    ) => {
      setState((current) => {
        const tx = current.transactions.find((item) => item.id === transactionId);
        if (!tx) {
          return current;
        }

        let nextCategories = [...current.categories];
        let { map: categoryIndexLocal, tree: treeLocal } = ensureCategoryIndex(nextCategories);

        const rebuildIndexes = () => {
          const refreshed = ensureCategoryIndex(nextCategories);
          categoryIndexLocal = refreshed.map;
          treeLocal = refreshed.tree;
        };

        let resolvedCategoryId = categoryId ?? null;
        let resolvedCategoryName: string | null = null;
        let resolvedMainId = mainCategoryId ?? null;
        let resolvedMainName: string | null = null;

        const ensureMainCategory = (id: string | null): Category | null => {
          if (!id) return null;
          return categoryIndexLocal.get(id) ?? null;
        };

        if (categoryName && categoryName.trim().length) {
          const trimmed = categoryName.trim();
          const siblingLookup = resolvedMainId
            ? (treeLocal.byParent[resolvedMainId] ?? []).find(
                (cat) => cat.name.toLowerCase() === trimmed.toLowerCase(),
              )
            : nextCategories.find(
                (cat) => !cat.parentId && cat.name.toLowerCase() === trimmed.toLowerCase(),
              );

          if (siblingLookup) {
            resolvedCategoryId = siblingLookup.id;
            resolvedCategoryName = siblingLookup.name;
            resolvedMainId = siblingLookup.parentId ?? resolvedMainId;
          } else {
            const newCategory: Category = {
              id: createId(),
              name: trimmed,
              parentId: resolvedMainId ?? null,
            };
            nextCategories = [...nextCategories, newCategory];
            rebuildIndexes();
            resolvedCategoryId = newCategory.id;
            resolvedCategoryName = newCategory.name;
            if (newCategory.parentId) {
              const parent = ensureMainCategory(newCategory.parentId);
              resolvedMainId = parent?.id ?? null;
              resolvedMainName = parent?.name ?? null;
            } else {
              resolvedMainId = newCategory.id;
              resolvedMainName = newCategory.name;
            }
          }
        }

        if (resolvedCategoryId && !resolvedCategoryName) {
          const category = categoryIndexLocal.get(resolvedCategoryId);
          resolvedCategoryName = category?.name ?? null;
          resolvedMainId = category?.parentId ?? resolvedMainId;
        }

        if (resolvedMainId && !resolvedMainName) {
          const main = ensureMainCategory(resolvedMainId);
          resolvedMainName = main?.name ?? null;
        }

        if (resolvedCategoryId && !resolvedMainId) {
          const category = categoryIndexLocal.get(resolvedCategoryId);
          if (category?.parentId) {
            const main = ensureMainCategory(category.parentId);
            resolvedMainId = main?.id ?? null;
            resolvedMainName = main?.name ?? null;
          }
        }

        const updatedTransactions = current.transactions.map((item) =>
          item.id === transactionId
            ? {
                ...item,
                categoryId: resolvedCategoryId,
                categoryName: resolvedCategoryName,
                mainCategoryId: resolvedMainId,
                mainCategoryName: resolvedMainName,
                autoCategorized: false,
                needsManualCategory: !resolvedCategoryId,
              }
            : item,
        );

        return {
          categories: nextCategories,
          transactions: updatedTransactions,
        };
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    setState(DEFAULT_STATE);
    persistState(DEFAULT_STATE);
  }, []);

  const value = useMemo<LedgerContextValue>(
    () => ({
      transactions: state.transactions,
      categories: state.categories,
      categoryTree,
      summary,
      reviewTransactions,
      importCsv,
      assignCategory,
      clearAll,
    }),
    [state.transactions, state.categories, categoryTree, summary, reviewTransactions, importCsv, assignCategory, clearAll],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
};

export const useLedger = (): LedgerContextValue => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};
