const Footer = () => {
  return (
    <footer className="relative isolate overflow-hidden px-4 pb-12 pt-20 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(122,122,255,0.24),_rgba(6,9,24,0))] blur-3xl" />
        <div className="absolute right-[8%] top-[55%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(36,196,255,0.18),_rgba(6,9,24,0))] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[960px] rounded-[40px] border border-white/12 bg-white/6 px-6 py-16 text-center shadow-[0_60px_180px_-110px_rgba(49,112,255,0.85)] backdrop-blur-2xl sm:px-10 lg:px-16">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">OpenFund</h2>
        <p className="mt-3 text-base text-white/70 sm:text-lg">Transparency made simple for nonprofits.</p>
        <div className="mt-10 space-y-2 text-sm font-medium text-white/60">
          <p>
            © 2025 OpenFund by{' '}
            <a
              href="https://prochat.tools/apps/non-profit/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline text-white/80"
            >
              ProChat™
            </a>
            . All rights reserved.
          </p>
          <p>Made with ❤️ for those who make a difference.</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
          <span>
            <a className="underline-offset-4 hover:underline" href="#">
              Privacy Policy
            </a>
          </span>
          <span>·</span>
          <span>
            <a className="underline-offset-4 hover:underline" href="#">
              Terms
            </a>
          </span>
          <span>·</span>
          <span>
            <a className="underline-offset-4 hover:underline" href="#">
              Contact Support
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
