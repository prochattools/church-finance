import { Heading, Logo } from "@/components";
import { Tick } from "@/icons";
import Image from "next/image";
import VsImg from "@/assets/images/vs.svg";
import VsColImg from "@/assets/images/vs-col.svg";

const cards = [
  {
    isGreen: false,
    title: "Financial Insights",
    items: [
      {
        time: "+ 15 hrs",
        text: "manual bookkeeping",
      },
      {
        time: "+ 3 hrs",
        text: "Excel chaos",
      },
      {
        time: "+ 8 hrs",
        text: "Donors constantly asking for transparency updates",
      },
      {
        time: "+ 4 hrs",
        text: "No simple way to show where donations go",
      },
      {
        time: "+ 12 hrs",
        text: "Outdated financial overviews the moment they're made",
      },
      {
        time: "+ 2 hrs",
        text: "Team members working from different versions of the truth",
      },
      {
        time: "+ 2 hrs",
        text: "No clear picture of how much impact each campaign actually has",
      },
    ],
    totalTime: "= 55 hours of PROBLEMS",
  },
  {
    isGreen: true,
    title: <Logo />,
    items: [
      { text: "Automatically imports transactions from your bank" },
      { text: "Categorizes every expense and donation" },
      { text: "Gives clear dashboards that anyone can understand" },
      { text: "Builds instant trust with your community" },
      { text: "Keeps all accounts, funds, and projects synchronized in one place" },
      { text: "Turns complex ledgers into easy, visual stories anyone can share" },
      { text: "Saves hours every month - so you can focus on your mission, not spreadsheets" },
    ],
    totalTime: "= 17 min Setup",
  },
];

const ComparisonCard = ({ item }: any) => {
  return (
    <div
      className={`relative max-w-[350px] w-full pb-8 pt-6 px-4 min-h-[385px] border rounded-[16px] bg-white dark:bg-gradient-to-r from-[#1E242D] to-[#0B111B] h-full scale-1 hover:scale-[1.05] transition-all duration-300 ${
        !item?.isGreen ? "border-[#EA2222]" : "border-[#1AAB12]"
      }`}
    >
      <div>
        <div className="text-black1 dark:text-white text-xl font-semibold mb-4">
          {item?.title}
        </div>
        {item?.items?.map((cardItem: any, index: number) => (
          <div
            key={index}
            className="flex gap-2 items-center justify-start mb-3"
          >
            {item?.isGreen ? (
              <div>
                <Tick width={20} height={20} />
              </div>
            ) : (
              <div className="text-[#EA2222] dark:text-white text-sm bg-[#FDE9E9] whitespace-nowrap dark:bg-[#EA2222] px-[6px] py-1 rounded-[5px]">
                {cardItem?.time}
              </div>
            )}
            <p className={`text-black1 dark:text-white font-inter text-sm`}>
              {cardItem?.text}
            </p>
          </div>
        ))}
      </div>
      <div
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 font-inter w-[250px] text-center font-bold text-base py-2 px-3 rounded-lg ${
          item?.isGreen
            ? "bg-[#1AAB12] text-white"
            : "bg-[#FDE9E9] text-[#EA2222] dark:text-white dark:bg-[#EA2222]"
        }`}
      >
        {item?.totalTime}
      </div>
    </div>
  );
};

const Comparison = () => {
  return (
    <div id="why" className="flex justify-center items-center w-full bg-white dark:bg-[#010814] pt-12 pb-24">
      <div className="max-w-[1440px] w-full px-4 sm:px-12">
        <div className="max-w-[640px] mx-auto mb-12">
          <Heading title="Why OpenFund Exists" desc="Nonprofits, fundraisers and churches handle funds with integrity - but explaining where it all goes is often a nightmare of spreadsheets, reports, and confusion." />
        </div>
        <div className="flex gap-8 items-center justify-center flex-col lg:flex-row">
          <ComparisonCard item={cards[0]} />
          <Image
            src={VsImg}
            alt="vs"
            width={134}
            height={350}
            className="h-[350px] hidden lg:block"
          />
          <Image
            src={VsColImg}
            alt="vs"
            width={134}
            height={350}
            className="h-[170px] block lg:hidden mt-4"
          />
          <ComparisonCard item={cards[1]} />
        </div>
      </div>
    </div>
  );
};

export default Comparison;
