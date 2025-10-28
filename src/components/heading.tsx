interface types {
  title: string;
  desc: string;
  maxWidth?: number;
}

const Heading = ({ title, desc, maxWidth }: types) => {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2
        className="mb-4 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white"
      >
        {title}
      </h2>
      <p
        className="text-base font-medium text-slate-600 sm:text-lg dark:text-white/70"
        style={{ maxWidth: maxWidth ? `${maxWidth}px` : "640px" }}
      >
        {desc}
      </p>
    </div>
  );
};

export default Heading;
