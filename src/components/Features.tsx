import { Heading } from "@/components";
import { Auth, Blog, Email, Landing, Payment, Seo } from "@/icons";

const data = [
  {
    icon: <Landing />,
    title: "Visual Fund Transparency",
    desc: "Instantly see income and expenses per project, event, or ministry. Clear graphs that tell your financial story - not just numbers.",
    features: [
      "Live dashboards for every fund, project, or ministry",
      "Instant comparisons of income versus expenses",
      "Share-ready visuals for board and donor updates",
    ],
    time: "LIVE TRANSPARENCY",
  },
  {
    icon: <Auth />,
    title: "Automated Ledger Imports",
    desc: "Drop in your monthly bank CSV. OpenFund auto-categorizes and matches your transactions - no manual entry needed.",
    features: [
      "Upload statements once and let OpenFund handle the matching",
      "Automatic reconciliation across all of your accounts",
      "Spot exceptions instantly without combing through rows",
    ],
    time: "90% LESS MANUAL WORK",
  },
  {
    icon: <Email />,
    title: "Smart Categorization",
    desc: "Detects recurring payees and expense types. Flags only the ones needing manual review (usually under 10%). Save up to 90% of the time you spend on spreadsheets.",
    features: [
      "Learns recurring payees and categories automatically",
      "Surfaces only edge cases that need a manual review",
      "Keeps your chart of accounts consistent across the team",
    ],
    time: "95% AUTO-CATEGORIZED",
  },
  {
    icon: <Payment />,
    title: "Shareable Transparency Pages",
    desc: "Generate secure public pages for fundraisers like 'Vila Solidaria'. Show donors the live breakdown of funds raised and spent.",
    features: [
      "Launch donor-facing pages with live raised vs. spent totals",
      "Control access with secure sharing links",
      "Embed updates anywhere to keep supporters informed",
    ],
    time: "TRUST AT A GLANCE",
  },
  {
    icon: <Seo />,
    title: "Multi-Account Dashboard",
    desc: "Manage multiple accounts - church, outreach, fundraising - from one place. Separate ledgers, one unified view.",
    features: [
      "Switch between church, outreach, and fundraising accounts instantly",
      "Keep ledgers separated while rolling them into a single overview",
      "See consolidated balances without exporting a thing",
    ],
    time: "ALL ACCOUNTS, ONE HUB",
  },
  {
    icon: <Blog />,
    title: "Peace of Mind",
    desc: "Every transaction is traceable, every euro accounted for. Transparency you can stand behind.",
    features: [
      "Maintain an audit-ready trail for every transaction",
      "Document impact stories alongside the numbers",
      "Give leadership and donors reports they can trust",
    ],
    time: "CONFIDENCE GUARANTEED",
  },
];

const Features = () => {
  return (
    <section id="what" className="relative isolate overflow-hidden px-4 py-24 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[18%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(122,122,255,0.28),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[4%] top-[58%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.22),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        <div className="mx-auto mb-20 max-w-[640px] text-center">
          <Heading
            title="What You'll Get With OpenFund"
            desc="Designed for those who give - helping you focus on your mission while OpenFund handles the numbers."
          />
        </div>
        <div className="grid gap-10 sm:grid-cols-2">
          {data?.map((item, index) => {
            return (
              <div
                key={index}
                className="rounded-[32px] border border-white/15 bg-white/5 p-8 shadow-[0_45px_140px_-90px_rgba(41,112,255,0.55)] backdrop-blur-2xl lg:p-10"
              >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/12 text-white">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-base text-white/75 sm:text-lg">
                    {item.desc}
                  </p>
                  <ul className="mt-6 space-y-3 text-white/80">
                    {item.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-sm font-medium leading-relaxed sm:text-base"
                      >
                        <span className="mt-1 size-2 rounded-full bg-gradient-to-r from-[#7A7AFF] to-[#24C4FF]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 inline-flex items-center rounded-full border border-white/20 bg-gradient-to-r from-[#7A7AFF] via-[#5F65FF] to-[#24C4FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_40px_-20px_rgba(99,97,255,0.85)]">
                    {item.time}
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
