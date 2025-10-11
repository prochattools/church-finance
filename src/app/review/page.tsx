'use client';

import { Suspense, useMemo } from 'react';
import { ReviewTable } from '@/components/review/ReviewTable';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useLedger } from '@/context/ledger-context';
import type { Category, LedgerTransaction } from '@/context/ledger-context';
import { ClipboardCheck } from 'lucide-react';

const REVIEW_MAIN_ID = 'cat-review';
const REVIEW_SUB_ID = 'sub-review-needs-category';

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageSkeleton />}>
      <ReviewPageContent />
    </Suspense>
  );
}

function ReviewPageSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#050B18] text-white/60">
      Loading review queue…
    </div>
  );
}

function ReviewPageContent() {
  const { reviewTransactions, transactions, categoryTree, assignCategory } = useLedger();

  const mainCategories = useMemo(
    () => categoryTree.main.filter((category) => category.id !== REVIEW_MAIN_ID),
    [categoryTree.main],
  );

  const subcategories = useMemo(() => {
    const result: Record<string, Category[]> = {};
    mainCategories.forEach((main) => {
      const subs = (categoryTree.byParent[main.id] ?? []).filter((category) => category.id !== REVIEW_SUB_ID);
      if (subs.length) {
        result[main.id] = subs;
      }
    });
    return result;
  }, [mainCategories, categoryTree.byParent]);

  const suggestions = useMemo(
    () => buildSuggestions(reviewTransactions, transactions),
    [reviewTransactions, transactions],
  );

  return (
    <DashboardShell
      title="Needs Review"
      subtitle="Resolve uncategorized transactions so your reports stay accurate"
      actions={
        <div className="hidden items-center gap-2 text-xs font-medium text-white/60 sm:inline-flex">
          <ClipboardCheck className="h-4 w-4" /> {reviewTransactions.length.toLocaleString()} items pending
        </div>
      }
    >
      <section className="rounded-2xl border border-white/5 bg-[#060F1F]/60 p-6 shadow-inner shadow-black/30">
        <ReviewTable
          transactions={reviewTransactions}
          categoryTree={{ mainCategories, subcategories }}
          suggestions={suggestions}
          onAssign={assignCategory}
        />
      </section>
    </DashboardShell>
  );
}

const AMOUNT_THRESHOLD = 0.01;

type Suggestion = {
  mainCategoryId?: string | null;
  categoryId?: string | null;
  confidence: 'high' | 'medium' | 'low';
};

function buildSuggestions(
  reviewTransactions: LedgerTransaction[],
  allTransactions: LedgerTransaction[],
): Record<string, Suggestion> {
  if (!reviewTransactions.length) return {};

  const history = allTransactions
    .filter((tx) => tx.categoryId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const suggestions: Record<string, Suggestion> = {};

  reviewTransactions.forEach((tx) => {
    const suggestion = guessCategory(tx, history);
    if (suggestion) {
      suggestions[tx.id] = suggestion;
    }
  });

  return suggestions;
}

function guessCategory(tx: LedgerTransaction, history: LedgerTransaction[]): Suggestion | null {
  const bySourceAmount = history.filter(
    (item) =>
      item.source === tx.source &&
      Math.abs(item.amount - tx.amount) <= AMOUNT_THRESHOLD &&
      item.categoryId,
  );

  if (bySourceAmount.length) {
    const chosen = chooseMostCommon(bySourceAmount);
    return {
      mainCategoryId: chosen.mainCategoryId ?? chosen.categoryId ?? null,
      categoryId: chosen.categoryId ?? null,
      confidence: 'high',
    };
  }

  const byComposite = history.filter(
    (item) =>
      item.source === tx.source &&
      item.normalizedKey === tx.normalizedKey &&
      item.categoryId,
  );
  if (byComposite.length) {
    const chosen = chooseMostCommon(byComposite);
    return {
      mainCategoryId: chosen.mainCategoryId ?? chosen.categoryId ?? null,
      categoryId: chosen.categoryId ?? null,
      confidence: 'medium',
    };
  }

  const bySource = history.filter((item) => item.source === tx.source && item.categoryId);
  if (bySource.length) {
    const chosen = chooseMostRecent(bySource);
    return {
      mainCategoryId: chosen.mainCategoryId ?? chosen.categoryId ?? null,
      categoryId: chosen.categoryId ?? null,
      confidence: 'medium',
    };
  }

  const byNormalized = history.filter(
    (item) => item.normalizedKey === tx.normalizedKey && item.categoryId,
  );
  if (byNormalized.length) {
    const chosen = chooseMostCommon(byNormalized);
    return {
      mainCategoryId: chosen.mainCategoryId ?? chosen.categoryId ?? null,
      categoryId: chosen.categoryId ?? null,
      confidence: 'low',
    };
  }

  const byAmount = history.filter((item) => item.amount === tx.amount && item.categoryId);
  if (byAmount.length) {
    const chosen = chooseMostRecent(byAmount);
    return {
      mainCategoryId: chosen.mainCategoryId ?? chosen.categoryId ?? null,
      categoryId: chosen.categoryId ?? null,
      confidence: 'low',
    };
  }

  return null;
}

function chooseMostCommon(items: LedgerTransaction[]): LedgerTransaction {
  const counts = new Map<string, { item: LedgerTransaction; count: number }>();
  items.forEach((item) => {
    const key = item.categoryId ?? item.mainCategoryId ?? '';
    const entry = counts.get(key) ?? { item, count: 0 };
    entry.item = item;
    entry.count += 1;
    counts.set(key, entry);
  });

  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
  return sorted[0]?.item ?? items[0];
}

function chooseMostRecent(items: LedgerTransaction[]): LedgerTransaction {
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? items[0];
}
