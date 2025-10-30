"use client";

import { useMemo } from "react";
import { useLedger } from "@/context/ledger-context";
import { cn } from "@/helpers/utils";
import { DEFAULT_LOCALE } from "@/constants/intl";

export default function Dashboard() {
  const { summary, ledgerMeta, rules } = useLedger();

  const reconciledCount = useMemo(
    () => ledgerMeta.filter((ledger) => ledger.lockedAt).length,
    [ledgerMeta]
  );

  const totalLedgers = ledgerMeta.length;
  const pendingCount = Math.max(totalLedgers - reconciledCount, 0);

  const statusTone =
    reconciledCount === totalLedgers && totalLedgers > 0
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : reconciledCount > 0
      ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
      : "border-white/20 bg-white/10 text-white/70";

  const statusLabel =
    reconciledCount === totalLedgers && totalLedgers > 0
      ? "✅ All reconciled"
      : reconciledCount > 0
      ? `✅ ${reconciledCount} reconciled · ⚠️ ${pendingCount} pending`
      : "⚠️ No reconciled periods yet";

  return (
    <div className="py-16">
      <div className="container mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Finance overview
            </h1>
            <p className="text-sm text-white/60">
              Track reconciliation progress and outstanding review work at a
              glance.
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-semibold",
              statusTone
            )}
          >
            {statusLabel}
          </span>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Transactions"
            value={summary.total.toLocaleString(DEFAULT_LOCALE)}
            hint="Imported records"
          />
          <DashboardCard
            title="Needs Review"
            value={summary.reviewCount.toLocaleString(DEFAULT_LOCALE)}
            hint="Uncategorized items"
          />
          <DashboardCard
            title="Active rules"
            value={rules.filter((rule) => rule.isActive).length.toLocaleString(DEFAULT_LOCALE)}
            hint={`${rules.length.toLocaleString(DEFAULT_LOCALE)} total`}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#060F1F]/70 px-4 py-5 text-sm text-white/80 shadow-inner shadow-black/30">
      <div className="text-[11px] uppercase tracking-wide text-white/50">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-white/40">{hint}</div> : null}
    </div>
  );
}
