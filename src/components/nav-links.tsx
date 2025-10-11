"use client";

import { ScrollToSection } from "@/utils/scroll-to-section";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavLink {
  icon?: JSX.Element;
  title: string;
  link: string;
}

interface PropsTypes {
  nav_links: NavLink[];
  isFooter?: boolean;
}

const NavLinks = ({ nav_links, isFooter = false }: PropsTypes) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (item: any, index: number) => {
    if (pathname === "/" && item?.link === "/") {
      ScrollToSection(index.toString());
    } else {
      router.push(item?.link);
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
      {nav_links?.map((item: NavLink, index: number) =>
        pathname === "/" && item?.link === "/" ? (
          <p
            key={index}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900/70 transition-all duration-200 ease-out hover:text-slate-900 hover:shadow-[0_10px_30px_-18px_rgba(80,120,255,0.55)] dark:text-white/70 dark:hover:text-white ${
              !isFooter
                ? ""
                : "w-full rounded-full px-0 py-0 text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-300"
            } ${isFooter ? "justify-start hover:shadow-none hover:text-slate-900 dark:hover:text-white" : ""}`}
            onClick={() => handleNavigate(item, index)}
          >
            <span>{item?.icon}</span> {item?.title}
          </p>
        ) : (
          <Link
            key={index}
            href={item?.link}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900/70 transition-all duration-200 ease-out hover:text-slate-900 hover:shadow-[0_10px_30px_-18px_rgba(80,120,255,0.55)] dark:text-white/70 dark:hover:text-white ${
              !isFooter
                ? ""
                : "w-full rounded-full px-0 py-0 text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-300"
            } ${isFooter ? "justify-start hover:shadow-none hover:text-slate-900 dark:hover:text-white" : ""}`}
            onClick={() => handleNavigate(item, index)}
          >
            <span>{item?.icon}</span> {item?.title}
          </Link>
        )
      )}
    </div>
  );
};

export default NavLinks;
