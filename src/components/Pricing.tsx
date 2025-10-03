import { Heading, IconButton } from "@/components";
import { Tick, NotInclude, RightArrow } from "@/icons";
import Image from "next/image";
import pricingBg from "@/assets/images/pricing-bg1.svg";
import pricingBgDark from "@/assets/images/pricing-bg2.svg";

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

const PricingCard = ({ item }: any) => {
  return (
    <div
      className={`relative min-w-[300px] sm:min-w-[330px] mt-16 w-fit pb-5 pt-10 bg-white dark:bg-gradient-to-r from-[#1E242D] to-[#0B111B] h-full scale-1 hover:scale-[1.05] transition-all duration-300 px-4 min-h-full border rounded-[16px] shadow-lg ${
        !item?.is_best_deal ? "border-[#2E4666]" : "border-[#1AAB12]"
      }`}
    >
      <div>
        <div>
          <p className="text-black1 dark:text-white font-medium text-lg">
            {item?.title}
          </p>
          <div className="flex items-center justify-start gap-2 my-3">
            {item?.price_before && (
              <p className="text-[#B7B8BB] dark:text-[#4D525A] font-semibold pt-2 text-[26px] line-through">
                {item?.price_before}
              </p>
            )}
            <p
              className={`text-[42px] font-bold ${
                item?.is_best_deal
                  ? "text-[#1AAB12]"
                  : "text-black1 dark:text-white"
              }`}
            >
              {item?.price_now}{" "}
              <span className="text-base font-semibold text-[#01061033] dark:text-[#808389]">
                / lifetime
              </span>
            </p>
          </div>
          {item?.features?.map((cardItem: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-3">
              <div className="text-[#FD9292] dark:text-[#873135]">
                {cardItem?.not_included ? (
                  <NotInclude />
                ) : (
                  <Tick
                    width={item?.is_best_deal ? 19 : 16}
                    height={item?.is_best_deal ? 19 : 16}
                  />
                )}
              </div>
              <div className="flex justify-between items-center gap-3">
                <p
                  className={`font-medium ${
                    cardItem?.not_included
                      ? "text-[#7B7E83] dark:text-[#4D525A]"
                      : "text-black1 dark:text-white"
                  } ${item?.is_best_deal ? "text-lg" : "text-base"}`}
                >
                  {cardItem?.text}
                </p>
                <p
                  className={`${
                    item?.is_best_deal && item?.features?.length - 1 === index
                      ? "bg-[#1AAB12] rounded-full flex items-center h-fit py-[6px] px-3 font-bold text-sm whitespace-nowrap text-white"
                      : "hidden"
                  }`}
                >
                  Update 4 days ago
                </p>
              </div>
            </div>
          ))}
        </div>
        <a href={item?.btn_link} target="_blank" className="mt-5 mb-3 block">
          <IconButton text="Get MicroSaaSFast" icon={<RightArrow />} />
        </a>
        <p
          className={`text-center text-[#7B7E83] dark:text-[#4D525A] ${
            item?.is_best_deal ? "text-lg" : "text-base"
          }`}
        >
          Pay once. Forever access.
          <br />
          Ship unlimited projects!
        </p>
      </div>
      {item?.is_best_deal && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1AAB12] text-white text-lg font-bold rounded-[8px] px-6 py-3 uppercase">
          Best deal
        </div>
      )}
    </div>
  );
};

const Pricing = () => {
  return (
    <div className="relative flex justify-center items-center w-full">
      <Image
        src={pricingBg}
        alt="background"
        fill
        style={{ objectFit: "cover" }}
        className="z-0 block dark:hidden"
      />
      <Image
        src={pricingBgDark}
        alt="background"
        fill
        style={{ objectFit: "cover" }}
        className="z-0 hidden dark:block"
      />
      <div className="relative z-10 max-w-[1440px] w-full px-4 sm:px-12 py-12">
        <div id="1" className="max-w-[675px] mx-auto">
          <Heading
            title="Save Hours of Boring Code, Ship Startup Fast, Start Earning $$$!"
            desc="Spend 1 hour to run your Micro SaaS startup and start making MONEY NOW!"
            maxWidth={354}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {pricing_card.map((card: any) => (
            <PricingCard key={card.id} item={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
