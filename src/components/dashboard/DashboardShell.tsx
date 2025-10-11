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
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#050B18] text-white">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#060F1F] md:flex md:flex-col">
        <div className="flex items-center gap-2 px-6 py-6 text-lg font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2970FF] text-base font-bold">
            F
          </span>
          Financial Overview
        </div>
        <nav className="flex-1 space-y-1 px-4 py-2">
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
                className={`group flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white ${
                  isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/70'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 pb-6 text-xs text-white/40">
          © {new Date().getFullYear()} Financial Freedom
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="flex flex-col gap-6 px-6 py-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
              {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
