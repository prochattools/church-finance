import { IconButton } from "@/components";
import { RightArrow } from "@/icons";
import config from "@/config";

const CTA = () => {
  return (
    <section className="relative isolate overflow-hidden px-4 py-24 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(98,97,255,0.32),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[-10%] top-[35%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.22),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[960px]">
        <div className="overflow-hidden rounded-[40px] border border-white/15 bg-[linear-gradient(145deg,rgba(122,122,255,0.24),rgba(8,12,28,0.92))] px-6 py-16 text-center shadow-[0_60px_170px_-100px_rgba(49,112,255,0.85)] backdrop-blur-2xl sm:px-12 lg:px-20">
          <div className="mx-auto flex max-w-[140px] items-center justify-center rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Launch ready
          </div>
          <h2 className="mt-8 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.8rem]">
            Ship your {config.appName} experience with the exact polish of ProChat.
          </h2>
          <p className="mx-auto mt-6 max-w-[540px] text-base text-white/70 sm:text-lg">
            Integrate payments, launch marketing pages, and automate donor journeys inside a single glassmorphic workspace.
            You maintain control, your stakeholders enjoy a refined interface.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="w-full sm:w-auto">
              <IconButton text={`Start with ${config.appName}`} icon={<RightArrow />} />
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:border-white/40 hover:bg-white/10">
              Talk to our team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
