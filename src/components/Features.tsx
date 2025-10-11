import { Heading } from "@/components";
import {
  Auth,
  Blog,
  Clerk,
  Database,
  Email,
  Landing,
  Licence,
  Licence2,
  NextJs,
  Payment,
  Postgres,
  Prisma,
  Resend,
  Seo,
  Shadecn,
  Stripe,
  Tailwind,
  Typescript,
  Ui,
  Wordpress,
} from "@/icons";
import Image from "next/image";

import LandingImg from "@/assets/images/landing.svg";
import AuthImg from "@/assets/images/auth.svg";
import EmailImg from "@/assets/images/email.svg";
import PaymentImg from "@/assets/images/payment.svg";
import SeoImg from "@/assets/images/seo.svg";
import BlogImg from "@/assets/images/blog.svg";
import DatabaseImg from "@/assets/images/database.svg";
import UiImg from "@/assets/images/ui.svg";
import LicenceImg from "@/assets/images/licence.svg";

const LandingImgUrl = LandingImg.src;
const AuthImgUrl = AuthImg.src;
const EmailImgUrl = EmailImg.src;
const PaymentImgUrl = PaymentImg.src;
const SeoImgUrl = SeoImg.src;
const BlogImgUrl = BlogImg.src;
const DatabaseImgUrl = DatabaseImg.src;
const UiImgUrl = UiImg.src;
const LicenceImgUrl = LicenceImg.src;

const data = [
  {
    icon: <Landing />,
    image: `${LandingImgUrl}`,
    title: "Landing Page",
    desc: "Balanced, awesome UI components that are tailored to highlight the VALUE of your micro SaaS, with a focus on boosting your conversion rate",
    features: [
      "Landing page",
      "Waitlist",
      "Dashboard",
      "8 Value focused UI sections",
    ],
    time: "10 HOURS SAVED",
    technologies: [
      {
        icon: <Typescript />,
        text: "TypeScript",
      },
      {
        icon: <NextJs />,
        text: "Next.Js",
      },
      {
        icon: <Tailwind />,
        text: "TailwindCSS",
      },
      {
        icon: <Shadecn />,
        text: "shadcn/ui",
      },
    ],
  },
  {
    icon: <Auth />,
    image: `${AuthImgUrl}`,
    title: "Auth & User Profiles",
    desc: "Fully completed user authentication with MFA/2FA and user profile modules",
    features: [
      "Sign up & Sign in pages",
      "User profile",
      "Google auth",
      "Verification code",
      "Organizations",
    ],
    time: "15 HOURS SAVED",
    technologies: [
      {
        icon: <Clerk />,
        text: "Clerk.com",
      },
    ],
  },
  {
    icon: <Email />,
    image: `${EmailImgUrl}`,
    title: "Emails",
    desc: "Welcome your users with sexy emails",
    features: [
      "Send transactional emails",
      "Email design",
      "DNS setup to avoid spam folder (DKIM, DMARC, SPF in subdomain)",
      "Webhook to receive & forward emails",
    ],
    time: "3 HOURS SAVED",
    technologies: [
      {
        icon: <Resend />,
        text: "Resend",
      },
    ],
  },
  {
    icon: <Payment />,
    image: `${PaymentImgUrl}`,
    title: "Payments",
    desc: "Start collecting payments (subscriptions and one-time purchases) in 4 minutes",
    features: [
      "Checkout sessions",
      "Webhooks to update the subscriptions",
      "One time payment & Subscriptions",
      "Pricing page",
      "Manage subscription",
    ],
    time: "8 HOURS SAVED",
    technologies: [
      {
        icon: <Stripe />,
        text: "Stripe",
      },
    ],
  },
  {
    icon: <Seo />,
    image: `${SeoImgUrl}`,
    title: "SEO",
    desc: "Everything that you need from SEO are inside. Rank higher on Google with the fully completed tech SEO",
    features: [
      "Sitemap",
      "Metatags",
      "Page speed optimisation",
      "OpenGraph",
      "Rich Snippets",
    ],
    time: "4 HOURS SAVED",
  },
  {
    icon: <Blog />,
    image: `${BlogImgUrl}`,
    title: "Blog CMS",
    desc: "Google loves WordPress SEO structure. You have your WordPress CMS inside with Next.js wrapper and sexy blog design and all metatags, etc",
    features: [
      "Preview page",
      "Article page",
      "CMS",
      "Custom design",
      "SEO optimized",
    ],
    time: "12 HOURS SAVED",
    technologies: [
      {
        icon: <Wordpress />,
        text: "WordPress",
      },
    ],
  },
  {
    icon: <Database />,
    image: `${DatabaseImgUrl}`,
    title: "Database ORM",
    desc: "Ideal DB setup for your fast lauch & future scalability",
    features: [
      "PostgreSQL (project)",
      "MySQL (Blog)",
      "Database schema with Prisma",
      "Simplified data transactions",
    ],
    time: "2 HOURS SAVED",
    technologies: [
      {
        icon: <Prisma />,
        text: "Prisma",
      },
      {
        icon: <Postgres />,
        text: "PostgreSQL",
      },
    ],
  },
  {
    icon: <Ui />,
    image: `${UiImgUrl}`,
    title: "UI Design",
    desc: "Design and UI components that boost your SALES and user attention to your marketing hooks",
    features: [
      "UI Next.js Components",
      "Components library with ChakraUI / Daisyui",
      "Built-in TailwindCSS / ShadcnUI",
      "Customizable theme to match your brand",
    ],
    time: "2 HOURS SAVED",
    technologies: [
      {
        icon: <Shadecn />,
        text: "Shadcn/UI",
      },
      {
        icon: <Tailwind />,
        text: "TailwindCSS",
      },
    ],
  },
  {
    icon: <Licence />,
    image: `${LicenceImgUrl}`,
    title: "License & Code Ownership",
    desc: "Your license is valid forever for unlimited apps. Build as many apps as you want, ship them to production, and use them forever",
    features: ["Code is yours!", "Build unlimited apps"],
    time: "ZERO Legal Headachaes",
    technologies: [
      {
        icon: <Licence2 />,
        text: "License",
      },
    ],
    isBlue: true,
  },
];

const Features = () => {
  return (
    <section className="relative isolate overflow-hidden px-4 py-24 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[18%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(122,122,255,0.28),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[4%] top-[58%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.22),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        <div className="mx-auto mb-20 max-w-[640px] text-center">
          <Heading
            title="Stop Coding. Start Orchestrating Experiences."
            desc="Borrowing the glassy ProChat aesthetic, every module is packaged with glowing gradients and bold typography so you launch in weeks, not quarters."
          />
        </div>
        <div className="flex flex-col gap-16">
          {data?.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className="grid gap-10 lg:grid-cols-2 lg:items-center"
              >
                <div
                  className={`order-2 overflow-hidden rounded-[32px] border border-white/15 bg-white/10 p-4 shadow-[0_45px_140px_-80px_rgba(49,112,255,0.6)] backdrop-blur-2xl lg:order-none ${
                    isEven ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={640}
                    height={360}
                    className="w-full rounded-[24px] object-cover"
                  />
                </div>
                <div
                  className={`rounded-[32px] border border-white/15 bg-white/5 p-8 shadow-[0_45px_140px_-90px_rgba(41,112,255,0.55)] backdrop-blur-2xl lg:p-10 ${
                    isEven ? "lg:order-1" : "lg:order-2"
                  }`}
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
                  {item?.technologies && (
                    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
                      {item?.technologies?.map((tech, techIndex) => (
                        <div
                          key={techIndex}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
                        >
                          {tech.icon} {tech.text}
                        </div>
                      ))}
                    </div>
                  )}
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
