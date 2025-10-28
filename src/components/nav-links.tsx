"use client";

import { useUser } from "@/utils/clerkClient";
import { ScrollToSection } from "@/utils/scroll-to-section";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent } from "react";
import { AUTH_ENABLED } from "@/utils/auth";
import { cn } from "@/helpers/utils";

export interface NavLink {
  id: string;
  icon?: JSX.Element;
  title: string;
  link: string;
  requiresAuth?: boolean;
  sectionId?: string;
  action?: "request-access";
  disabled?: boolean;
}

interface PropsTypes {
  nav_links: NavLink[];
  isFooter?: boolean;
  onRequestAccess?: () => void;
  onNavigate?: () => void;
}

const NavLinks = ({ nav_links, isFooter = false, onRequestAccess, onNavigate }: PropsTypes) => {
  const router = useRouter();
  const pathname = usePathname();
  const clerkUser = useUser();
  const isSignedIn = AUTH_ENABLED ? clerkUser?.isSignedIn ?? false : true;
  const isLoaded = AUTH_ENABLED ? clerkUser?.isLoaded ?? false : true;

  const handleNavigate = (event: MouseEvent<HTMLElement>, item: NavLink) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    if (item.action === "request-access") {
      event.preventDefault();
      onRequestAccess?.();
      onNavigate?.();
      return;
    }

    if (AUTH_ENABLED && item.requiresAuth && (!isLoaded || !isSignedIn)) {
      event.preventDefault();
      const target = item.link ?? "/";
      const search = new URLSearchParams({ redirect_url: target });
      router.push(`/sign-in?${search.toString()}`);
      onNavigate?.();
      return;
    }

    if (item.sectionId) {
      const targetSection = item.sectionId;
      if (pathname === "/") {
        event.preventDefault();
        ScrollToSection(targetSection);
        onNavigate?.();
        return;
      }

      if (!item.link || item.link === "/" || item.link.startsWith("/#")) {
        event.preventDefault();
        router.push(`/#${targetSection}`);
        setTimeout(() => {
          ScrollToSection(targetSection);
        }, 150);
        onNavigate?.();
        return;
      }
    }

    if (item.link?.startsWith("/#")) {
      event.preventDefault();
      router.push(item.link);
      if (item.sectionId) {
        setTimeout(() => {
          ScrollToSection(item.sectionId!);
        }, 150);
      }
      onNavigate?.();
      return;
    }

    onNavigate?.();
  };

  const iconWrapperBase =
    "flex size-7 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-700 shadow-sm transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:text-white/80 [&>svg]:h-4 [&>svg]:w-4";

  return (
    <div
      className={`flex ${
        isFooter
          ? "flex-col gap-y-4"
          : "flex-col items-start gap-y-4 lg:flex-row lg:items-center lg:gap-y-0"
      } gap-x-8`}
    >
      {nav_links?.map((item: NavLink) => {
        const key = `${item.id}-${item.title}`;

        const baseClasses = isFooter
          ? "flex items-center gap-2 rounded-full px-0 py-0 text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors duration-150 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          : "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900/75 transition-all duration-200 hover:text-slate-900 hover:shadow-[0_12px_30px_-20px_rgba(80,120,255,0.45)] dark:text-white/70 dark:hover:text-white";

        const disabledClasses = item.disabled
          ? "cursor-default text-slate-400 hover:shadow-none dark:text-white/40"
          : "cursor-pointer";

        const content = (
          <>
            {!isFooter ? (
              <span
                className={cn(
                  iconWrapperBase,
                  item.disabled
                    ? "border-slate-200 bg-white/60 text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-white/40"
                    : "hover:border-slate-300 hover:text-slate-900 dark:hover:border-white/25",
                )}
              >
                {item.icon}
              </span>
            ) : null}
            <span className='whitespace-nowrap'>{item.title}</span>
          </>
        );

        if (item.disabled) {
          return (
            <span key={key} className={cn(baseClasses, disabledClasses)} aria-disabled='true'>
              {content}
            </span>
          );
        }

        if (item.action === "request-access") {
          return (
            <button
              key={key}
              type='button'
              className={cn(baseClasses, disabledClasses)}
              onClick={(event) => {
                event.preventDefault();
                onRequestAccess?.();
                onNavigate?.();
              }}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={key}
            href={item.link}
            className={cn(baseClasses, disabledClasses)}
            onClick={(event) => handleNavigate(event, item)}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
};

export default NavLinks;
