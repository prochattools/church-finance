import { Logo } from "@/components";
import NavLinks from "@/components/nav-links";
import { Telegram, Youtube } from "@/icons";
import Link from "next/link";

const nav_links1 = [
  {
    title: "Demo",
    link: "/",
  },
  {
    title: "Pricing",
    link: "/",
  },
  {
    title: "Support",
    link: "#",
  },
  {
    title: "Documentation",
    link: "https://docs.microsaasfast.me/",
  },
  {
    title: "Affiliates - Earn up to $123 per sale",
    link: "#",
  },
];

const nav_links2 = [
  {
    title: "Terms of services",
    link: "https://elegant-nightshade-79e.notion.site/Terms-Services-4335df481a50486ca26c81e699a2fbf1",
  },
  {
    title: "Privacy Policy",
    link: "https://elegant-nightshade-79e.notion.site/Privacy-policy-f2a3142bfb8c4b16b80369c19263c23a",
  },
  {
    title: "Licences",
    link: "#",
  },
];

const socials = [
  {
    link: "https://www.google.com",
    icon: <Youtube />,
    label: "YouTube",
  },
  {
    link: "https://www.google.com",
    icon: <Telegram />,
    label: "Telegram",
  },
];

const Footer = () => {
  return (
    <footer className="relative isolate overflow-hidden px-4 pb-12 pt-20 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(122,122,255,0.24),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[8%] top-[55%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.18),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1200px] rounded-[40px] border border-white/12 bg-white/6 px-6 py-16 shadow-[0_60px_180px_-110px_rgba(49,112,255,0.85)] backdrop-blur-2xl sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-6">
            <Link href="/" aria-label="Go to homepage">
              <Logo />
            </Link>
            <p className="max-w-sm text-sm text-white/70">
              Launch your SaaS in days, not weeks. We blend rock-solid architecture with the luminous ProChat-inspired interface.
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/60">
              © 2025 Church Finance. All rights reserved.
            </p>
          </div>
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              Explore
            </p>
            <NavLinks nav_links={nav_links1} isFooter />
          </div>
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              Legal
            </p>
            <NavLinks nav_links={nav_links2} isFooter />
          </div>
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              Stay in touch
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {socials.map((item) => (
                <Link
                  key={item.label}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-3 text-white/80 transition-colors duration-200 hover:border-white/35 hover:bg-white/15"
                  aria-label={item.label}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs font-medium uppercase tracking-[0.35em] text-white/50">
          Crafted by DennisBabych & DesignFast2
        </div>
      </div>
    </footer>
  );
};

export default Footer;
