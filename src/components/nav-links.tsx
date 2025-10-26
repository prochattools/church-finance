"use client";

import { useUser } from "@/utils/clerkClient";
import { ScrollToSection } from "@/utils/scroll-to-section";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent } from "react";
import { AUTH_ENABLED } from "@/utils/auth";

interface NavLink {
  icon?: JSX.Element;
  title: string;
  link: string;
  requiresAuth?: boolean;
}

interface PropsTypes {
  nav_links: NavLink[];
  isFooter?: boolean;
}

const NavLinks = ({ nav_links, isFooter = false }: PropsTypes) => {
  const router = useRouter();
  const pathname = usePathname();
  const clerkUser = AUTH_ENABLED ? useUser() : null;
  const isSignedIn = AUTH_ENABLED ? clerkUser?.isSignedIn ?? false : true;
  const isLoaded = AUTH_ENABLED ? clerkUser?.isLoaded ?? false : true;

  const handleNavigate = (
    event: MouseEvent<HTMLElement>,
    item: NavLink,
    index: number,
  ) => {
    if (AUTH_ENABLED && item.requiresAuth && (!isLoaded || !isSignedIn)) {
      event.preventDefault();
      const target = item.link ?? "/";
      const search = new URLSearchParams({ redirect_url: target });
      router.push(`/sign-in?${search.toString()}`);
      return;
    }

    if (pathname === "/" && item.link === "/") {
      event.preventDefault();
      ScrollToSection(index.toString());
      return;
    }

    // allow normal navigation but keep smooth scroll for one-page sections
    if (item.link.startsWith("/#")) {
      event.preventDefault();
      router.push(item.link);
      return;
    }

    // For internal navigation we still trigger section scroll after a delay.
    if (pathname !== item.link && item.link === "/") {
      router.push(item.link);
      setTimeout(() => {
        ScrollToSection(index.toString());
      }, 1500);
    }
  };

  return (
    <div
      className={`flex ${
        isFooter
          ? "flex-col gap-y-4"
          : "flex-col items-start gap-y-4 lg:flex-row lg:items-center lg:gap-y-0"
      } gap-x-8`}
    >
      {nav_links?.map((item: NavLink, index: number) => {
        const baseClasses =
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900/70 transition-all duration-200 ease-out hover:text-slate-900 hover:shadow-[0_10px_30px_-18px_rgba(80,120,255,0.55)] dark:text-white/70 dark:hover:text-white";
        const footerClasses = isFooter
          ? "w-full rounded-full px-0 py-0 text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-300 justify-start hover:shadow-none hover:text-slate-900 dark:hover:text-white"
          : "";

        if (pathname === "/" && item.link === "/") {
          return (
            <p
              key={`${item.title}-${index}`}
              className={`${baseClasses} cursor-pointer ${footerClasses}`}
              onClick={(event) => handleNavigate(event, item, index)}
            >
              <span>{item.icon}</span> {item.title}
            </p>
          );
        }

        return (
          <Link
            key={`${item.title}-${index}`}
            href={item.link}
            className={`${baseClasses} ${footerClasses}`}
            onClick={(event) => handleNavigate(event, item, index)}
          >
            <span>{item.icon}</span> {item.title}
          </Link>
        );
      })}
    </div>
  );
};

export default NavLinks;
