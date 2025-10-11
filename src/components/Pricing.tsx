import { Heading, IconButton } from "@/components";
import { NotInclude, RightArrow, Tick } from "@/icons";

const pricing_card = [
  {
    id: 1,
    title: "Starter",
    price_before: "$307",
    price_now: "$207",
    is_best_deal: false,
    btn_link: "https://buy.stripe.com/5kA5nF3pxdgh2bK5kn",
    features: [
      {
        id: 1,
        text: "NextJS boilerplate",
      },
      {
        id: 2,
        text: "Auth & User Profile",
      },
      {
        id: 3,
        text: "SEO",
      },
      {
        id: 4,
        text: "SEO Blog CMS / WP",
      },
      {
        id: 5,
        text: "Resend emails",
      },
      {
        id: 6,
        text: "Stripe",
      },
      {
        id: 7,
        text: "PostgreSQL / Prisma",
      },
      {
        id: 8,
        text: "Components & animations",
      },
      {
        id: 9,
        text: "User Dashboard",
      },
      {
        id: 10,
        text: "Docker container",
      },
      {
        id: 11,
        text: "Waiting list",
        not_included: true,
      },
      {
        id: 12,
        text: "Invoice generation tool",
        not_included: true,
      },
      {
        id: 13,
        text: "Discord founders community",
        not_included: true,
      },
    ],
  },
  {
    id: 2,
    title: "Full package",
    price_before: "$347",
    price_now: "$247",
    is_best_deal: true,
    btn_link: "https://buy.stripe.com/3csaHZ9NV2BD8A8004",
    features: [
      {
        id: 1,
        text: "NextJS boilerplate",
      },
      {
        id: 2,
        text: "Auth & User Profile",
      },
      {
        id: 3,
        text: "SEO",
      },
      {
        id: 4,
        text: "SEO Blog CMS / WP",
      },
      {
        id: 5,
        text: "Resend emails",
      },
      {
        id: 6,
        text: "Stripe",
      },
      {
        id: 7,
        text: "PostgreSQL / Prisma",
      },
      {
        id: 8,
        text: "Components & animations",
      },
      {
        id: 9,
        text: "User Dashboard",
      },
      {
        id: 10,
        text: "Docker container",
      },
      {
        id: 11,
        text: "Waiting list",
      },
      {
        id: 12,
        text: "Invoice generation tool",
      },
      {
        id: 13,
        text: "Discord founders community",
      },
      {
        id: 14,
        text: "Lifetimes updates",
      },
    ],
  },
];

const PricingCard = ({ item }: { item: (typeof pricing_card)[number] }) => {
  const cardClasses = item?.is_best_deal
    ? "border-white/25 bg-[linear-gradient(160deg,rgba(122,122,255,0.34),rgba(23,33,78,0.85))] shadow-[0_40px_140px_-80px_rgba(49,112,255,0.85)]"
    : "border-white/12 bg-white/8 shadow-[0_35px_120px_-90px_rgba(49,112,255,0.55)]";

  return (
    <div className={`relative flex h-full flex-col gap-6 rounded-[32px] p-8 backdrop-blur-2xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_42px_150px_-90px_rgba(49,112,255,0.85)] ${cardClasses}`}>
      {item?.is_best_deal && (
        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/85 shadow-[0_10px_30px_-20px_rgba(99,97,255,0.75)] backdrop-blur-xl">
          Best deal
        </div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          {item?.title}
        </p>
        <div className="flex items-center gap-3">
          {item?.price_before && (
            <span className="text-lg font-medium text-white/40 line-through">
              {item?.price_before}
            </span>
          )}
          <p className="text-4xl font-semibold text-white sm:text-[2.75rem]">
            {item?.price_now}
            <span className="ml-1 text-sm font-medium text-white/60">/ lifetime</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {item?.features?.map((cardItem) => (
          <div
            key={cardItem.id}
            className="flex items-start gap-3 text-sm text-white/80 sm:text-base"
          >
            <span className="mt-0.5 flex h-5 w-5 items-center justify-center">
              {cardItem?.not_included ? (
                <NotInclude />
              ) : (
                <Tick width={18} height={18} />
              )}
            </span>
            <span
              className={`flex-1 ${
                cardItem?.not_included ? "text-white/35 line-through" : ""
              }`}
            >
              {cardItem?.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-3 pt-2">
        <a
          href={item?.btn_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <IconButton text="Get MicroSaaSFast" icon={<RightArrow />} />
        </a>
        <p className="text-center text-sm font-medium text-white/65">
          Pay once. Forever access. <br />
          Ship unlimited projects!
        </p>
      </div>
    </div>
  );
};

const Pricing = () => {
  return (
    <section className="relative isolate overflow-hidden px-4 py-24 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-[10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(122,122,255,0.25),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[18%] top-[60%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.2),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        <div id="1" className="mx-auto max-w-[620px] text-center">
          <Heading
            title="Transparent pricing, ProChat polish."
            desc="Lifetime licenses with the same glossy finish: deploy faster, own your stack, and iterate without worrying about mounting subscriptions."
            maxWidth={480}
          />
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {pricing_card.map((card) => (
            <PricingCard key={card.id} item={card} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
