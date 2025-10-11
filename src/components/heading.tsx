interface types {
  title: string;
  desc: string;
  maxWidth?: number;
}

const Heading = ({ title, desc, maxWidth }: types) => {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2
        className="mb-4 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.75rem]"
      >
        {title}
      </h2>
      <p
        className="text-base font-medium text-white/70 sm:text-lg"
        style={{ maxWidth: maxWidth ? `${maxWidth}px` : "640px" }}
      >
        {desc}
      </p>
    </div>
  );
};

export default Heading;
