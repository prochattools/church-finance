'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { Category, LedgerTransaction } from '@/context/ledger-context';
import { AccountBadge } from '@/components/ledger/AccountBadge';
import { buildTransactionTooltip } from '@/helpers/transaction-tooltip';

type SuggestionMap = Record<
  string,
  {
    mainCategoryId?: string | null;
    categoryId?: string | null;
    confidence: 'high' | 'medium' | 'low';
  }
>;

interface CategoryTreeProps {
  mainCategories: Category[];
  subcategories: Record<string, Category[]>;
}

interface ReviewTableProps {
  transactions: LedgerTransaction[];
  categoryTree: CategoryTreeProps;
  suggestions?: SuggestionMap;
  onAssign: (transactionId: string, payload: { categoryId?: string | null; mainCategoryId?: string | null; categoryName?: string }) => Promise<void>;
  onCreateRule?: (transaction: LedgerTransaction) => void;
}

export function ReviewTable({ transactions, categoryTree, suggestions = {}, onAssign, onCreateRule }: ReviewTableProps) {
  const [selectedMain, setSelectedMain] = useState<Record<string, string>>({});
  const [selectedSub, setSelectedSub] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMain((prev) => {
      const next: Record<string, string> = { ...prev };
      transactions.forEach((tx) => {
        if (!next[tx.id]) {
          const suggestion = suggestions[tx.id]?.mainCategoryId;
          if (suggestion) {
            next[tx.id] = suggestion;
          }
        }
      });
      return next;
    });

    setSelectedSub((prev) => {
      const next: Record<string, string> = { ...prev };
      transactions.forEach((tx) => {
        if (!next[tx.id]) {
          const suggestion = suggestions[tx.id]?.categoryId;
          if (suggestion) {
            next[tx.id] = suggestion;
          }
        }
      });
      return next;
    });

    setCustom((prev) => {
      const next: Record<string, string> = {};
      transactions.forEach((tx) => {
        if (prev[tx.id]) {
          next[tx.id] = prev[tx.id];
        }
      });
      return next;
    });
  }, [transactions, suggestions]);

  const handleAssign = async (transactionId: string) => {
    const mainId = selectedMain[transactionId] ?? null;
    const subId = selectedSub[transactionId] ?? null;
    const customLabel = custom[transactionId]?.trim();

    if (!mainId && !subId && !customLabel) {
      toast.error('Choose a main/sub category or type a custom label.');
      return;
    }

    setPendingId(transactionId);

    try {
      await onAssign(transactionId, {
        categoryId: subId || (mainId && !customLabel ? mainId : undefined),
        mainCategoryId: mainId ?? undefined,
        categoryName: customLabel || undefined,
      });
      toast.success('Category saved');
      setSelectedMain((state) => ({ ...state, [transactionId]: '' }));
      setSelectedSub((state) => ({ ...state, [transactionId]: '' }));
      setCustom((state) => ({ ...state, [transactionId]: '' }));
    } catch (error) {
      console.error(error);
      toast.error('Unable to save category');
    } finally {
      setPendingId(null);
    }
  };

  const filteredMainCategories = useMemo(
    () => categoryTree.mainCategories,
    [categoryTree.mainCategories],
  );

  const [showMainForm, setShowMainForm] = useState<Record<string, boolean>>({});
  const [showSubForm, setShowSubForm] = useState<Record<string, boolean>>({});
  const [mainDraft, setMainDraft] = useState<Record<string, string>>({});
  const [subDraft, setSubDraft] = useState<Record<string, string>>({});

  if (!transactions.length) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        All caught up — no transactions need review.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Payee</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Main category</th>
            <th className="px-4 py-3">Sub category</th>
            <th className="px-4 py-3">Custom label</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const d = new Date(tx.date);
            const dateLabel = d.toLocaleDateString();
            const disabled = pendingId === tx.id;
            const mainId = selectedMain[tx.id] ?? '';
            const subId = selectedSub[tx.id] ?? '';
            const availableSubcategories = mainId ? categoryTree.subcategories[mainId] ?? [] : [];
            const mainFormVisible = showMainForm[tx.id] ?? false;
            const subFormVisible = showSubForm[tx.id] ?? false;
            const suggestion = suggestions[tx.id];
            const mainSuggested = Boolean(suggestion?.mainCategoryId) && suggestion?.mainCategoryId === mainId;
            const subSuggested = Boolean(suggestion?.categoryId) && suggestion?.categoryId === subId;
            const tooltipContent = buildTransactionTooltip(tx);
            const tooltipProps: Record<string, string> = tooltipContent
              ? {
                  'data-tooltip-id': 'tooltip',
                  'data-tooltip-content': tooltipContent,
                  'data-tooltip-place': 'top',
                }
              : {};

            const suggestionBadge = suggestion ? (
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  suggestion.confidence === 'high'
                    ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : suggestion.confidence === 'medium'
                    ? 'border border-amber-400/40 bg-amber-500/10 text-amber-200'
                    : 'border border-orange-400/40 bg-orange-500/10 text-orange-200'
                }`}
              >
                Suggested • verify
              </span>
            ) : null;

            const handleCreateMain = () => {
              const value = (mainDraft[tx.id] ?? '').trim();
              if (!value) {
                toast.error('Enter a main category name');
                return;
              }
              setSelectedMain((state) => ({ ...state, [tx.id]: value }));
              setSelectedSub((state) => ({ ...state, [tx.id]: '' }));
              setShowMainForm((state) => ({ ...state, [tx.id]: false }));
              setMainDraft((state) => ({ ...state, [tx.id]: '' }));
            };

            const handleCreateSub = () => {
              const value = (subDraft[tx.id] ?? '').trim();
              if (!value) {
                toast.error('Enter a sub category name');
                return;
              }
              if (!mainId) {
                toast.error('Select or create a main category first');
                return;
              }
              setSelectedSub((state) => ({ ...state, [tx.id]: value }));
              setShowSubForm((state) => ({ ...state, [tx.id]: false }));
              setSubDraft((state) => ({ ...state, [tx.id]: '' }));
            };

            return (
              <tr key={tx.id} className="border-t align-top">
                <td className="px-4 py-3">{dateLabel}</td>
                <td className="px-4 py-3">
                  <div
                    className={`font-medium${
                      tooltipContent ? ' cursor-help decoration-dotted underline-offset-4 hover:underline' : ''
                    }`}
                    {...tooltipProps}
                  >
                    {tx.description}
                  </div>
                  <div className="mt-1">
                    <AccountBadge
                      label={tx.accountLabel}
                      identifier={tx.accountIdentifier}
                      fallback={tx.source}
                      className={tx.accountLabel ? 'bg-white/5 text-white/80' : undefined}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {tx.amount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`w-full rounded border px-2 py-1 text-sm transition ${
                      mainSuggested
                        ? 'border-amber-300 bg-amber-500/10 text-amber-50'
                        : 'border border-white/10 bg-background text-white/90'
                    }`}
                    value={mainId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedMain((state) => ({ ...state, [tx.id]: value }));
                      setSelectedSub((state) => ({ ...state, [tx.id]: '' }));
                    }}
                    disabled={disabled}
                  >
                    <option value="">Select main category</option>
                    {filteredMainCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {suggestionBadge}
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
                    onClick={() => setShowMainForm((state) => ({ ...state, [tx.id]: !mainFormVisible }))}
                    disabled={disabled}
                  >
                    + Add main category
                  </button>
                  {mainFormVisible && (
                    <div className="mt-2 space-y-2 rounded-lg border border-amber-400/30 bg-[#1b1d22]/80 p-3">
                      <input
                        type="text"
                        className="w-full rounded border border-amber-300/30 bg-[#11141d] px-3 py-2 text-sm text-amber-100 placeholder:text-amber-200/50 focus:border-amber-300 focus:outline-none"
                        placeholder="New main category"
                        value={mainDraft[tx.id] ?? ''}
                        onChange={(event) => setMainDraft((state) => ({ ...state, [tx.id]: event.target.value }))}
                        disabled={disabled}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-400/20 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/30"
                          onClick={handleCreateMain}
                          disabled={disabled}
                        >
                          Save main category
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-amber-400/30 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10"
                          onClick={() => {
                            setShowMainForm((state) => ({ ...state, [tx.id]: false }));
                            setMainDraft((state) => ({ ...state, [tx.id]: '' }));
                          }}
                          disabled={disabled}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`w-full rounded border px-2 py-1 text-sm transition ${
                      subSuggested
                        ? 'border-amber-300 bg-amber-500/10 text-amber-50'
                        : 'border border-white/10 bg-background text-white/90'
                    }`}
                    value={subId}
                    onChange={(event) =>
                      setSelectedSub((state) => ({ ...state, [tx.id]: event.target.value }))
                    }
                    disabled={disabled || !mainId || availableSubcategories.length === 0}
                  >
                    <option value="">{mainId ? 'Select sub category' : 'Pick main category first'}</option>
                    {availableSubcategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
                    onClick={() => setShowSubForm((state) => ({ ...state, [tx.id]: !subFormVisible }))}
                    disabled={disabled || (!mainId && !mainFormVisible)}
                  >
                    + Add sub category
                  </button>
                  {subFormVisible && (
                    <div className="mt-2 space-y-2 rounded-lg border border-amber-400/30 bg-[#1b1d22]/80 p-3">
                      <input
                        type="text"
                        className="w-full rounded border border-amber-300/30 bg-[#11141d] px-3 py-2 text-sm text-amber-100 placeholder:text-amber-200/50 focus:border-amber-300 focus:outline-none"
                        placeholder={mainId ? 'New sub category' : 'Select a main category first'}
                        value={subDraft[tx.id] ?? ''}
                        onChange={(event) => setSubDraft((state) => ({ ...state, [tx.id]: event.target.value }))}
                        disabled={disabled || (!mainId && !mainFormVisible)}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-400/20 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/30"
                          onClick={handleCreateSub}
                          disabled={disabled || (!mainId && !mainFormVisible)}
                        >
                          Save sub category
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-amber-400/30 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10"
                          onClick={() => {
                            setShowSubForm((state) => ({ ...state, [tx.id]: false }));
                            setSubDraft((state) => ({ ...state, [tx.id]: '' }));
                          }}
                          disabled={disabled}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Optional custom label"
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                    value={custom[tx.id] ?? ''}
                    onChange={(event) =>
                      setCustom((state) => ({ ...state, [tx.id]: event.target.value }))
                    }
                    disabled={disabled}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded bg-primary px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
                      onClick={() => handleAssign(tx.id)}
                      disabled={disabled}
                    >
                      {disabled ? 'Saving…' : 'Save'}
                    </button>
                    {onCreateRule ? (
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                        onClick={() => onCreateRule(tx)}
                        disabled={disabled}
                      >
                        Create rule
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
