'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';
import {
  LayoutDashboard as LayoutDashboardIcon,
  Table2 as TableIcon,
  TrendingUp,
  Inbox as InboxIcon,
  PieChart,
} from 'lucide-react';

const NAVIGATION = [
  { href: '/ledger', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/ledger?view=overview', label: 'Monthly Overview', icon: PieChart },
  { href: '/ledger?view=transactions', label: 'Transactions', icon: TableIcon },
  { href: '/ledger?view=cashflow', label: 'Cash Flow', icon: TrendingUp },
  { href: '/review', label: 'Review Queue', icon: InboxIcon },
];

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ title, subtitle, actions, children }: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams?.get('view');

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-[#050B18] dark:text-white">
      <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-0 py-8 sm:px-0">
          <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_90px_-60px_rgba(41,112,255,0.65)]">
            {NAVIGATION.map((item) => {
              const isActive = (() => {
                if (item.href === '/ledger') {
                  return pathname === '/ledger' && !view;
                }
                const viewMatch = item.href.match(/view=([^&]+)/);
                if (viewMatch) {
                  return pathname === '/ledger' && view === viewMatch[1];
                }
                return pathname === item.href;
              })();
              const Icon = item.icon ?? PieChart;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    isActive
                      ? 'bg-[#2970FF] text-white shadow-[0_12px_45px_-18px_rgba(41,112,255,0.9)] dark:bg-[#2970FF]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-[14px] w-[14px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <header className="flex flex-col gap-4 border-b border-white/10 pb-6 px-4 sm:px-6 lg:px-0 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="text-sm text-slate-600 dark:text-white/60">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </header>

          <div className="px-4 pb-12 sm:px-6 lg:px-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
