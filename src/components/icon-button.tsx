const IconButton = ({
  text,
  isLeft,
  icon,
  isDownload,
  isDisable,
  isSubmit = true,
  isLoading,
}: any) => {
  return (
    <button
      type={isSubmit ? "submit" : "button"}
      className={`group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full px-7 py-3 text-sm font-semibold text-white transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        isDisable ? "pointer-events-none" : "hover:scale-[1.02]"
      }`}
      disabled={isLoading}
    >
      <span className="absolute inset-0 z-0 bg-gradient-to-r from-[#5D5AF6] via-[#6E62FF] to-[#24C4FF]" />
      <span className="absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_rgba(255,255,255,0))]" />
      {!isLoading ? (
        <span
          className={`relative z-[1] flex items-center justify-center ${
            icon ? "gap-2" : ""
          }`}
        >
          {isLeft && (
            <span className={`${isDownload ? "rotate-90" : ""}`}>{icon}</span>
          )}
          <span>{text}</span>
          {!isLeft && !isDisable && (
            <span className={`${isDownload ? "rotate-90" : ""}`}>{icon}</span>
          )}
        </span>
      ) : (
        <div className="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default IconButton;
