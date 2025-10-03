"use client";

import React, { FC } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import CheckoutButton from "./CheckoutButton";
import { NotInclude, Tick } from "@/icons";

interface PriceItemProps {
  item: StripeProduct;
  isLink?: boolean;
  disabled?: boolean;
}

const PriceItem: FC<PriceItemProps> = ({
  item,
  isLink = false,
  disabled = false,
}) => {
  console.log(item, "pricing cards");
  const isSubscription = item.type === "subscription";

  return (
    <div
      className={`relative min-w-[300px] lg:min-w-[330px] w-fit pb-6 pt-10 bg-white dark:bg-gradient-to-r from-[#1E242D] to-[#0B111B] scale-1 hover:scale-[1.05] transition-all duration-300 px-4 border rounded-[16px] shadow-lg ${
        !item?.isBest ? "border-[#2E4666]" : "border-[#1AAB12]"
      }`}
    >
      <div>
        <div>
          <p className="text-black1 dark:text-white font-medium text-lg">
            {item?.title}
          </p>

          <div className="flex items-center justify-start gap-2 my-3">
            <p
              className={`text-[42px] font-bold ${
                item?.isBest ? "text-[#1AAB12]" : "text-black1 dark:text-white"
              }`}
            >
              {item?.price}{" "}
              <span className="text-base font-semibold text-[#01061033] dark:text-[#808389]">
                / {isSubscription ? (item as StripePlan).period : "one-time"}
              </span>
            </p>
          </div>
          {item.subtitle && (
            <p className="text-green-600 font-semibold mb-6">{item.subtitle}</p>
          )}
          {item?.features?.map((cardItem: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-3">
              <div className="text-[#FD9292] dark:text-[#873135]">
                {cardItem?.disabled ? (
                  <NotInclude />
                ) : (
                  <Tick
                    width={item?.isBest ? 19 : 16}
                    height={item?.isBest ? 19 : 16}
                  />
                )}
              </div>
              <div className="flex justify-between items-center gap-3">
                <p
                  className={`font-medium ${
                    cardItem?.disabled
                      ? "text-[#7B7E83] dark:text-[#4D525A]"
                      : "text-black1 dark:text-white"
                  } ${item?.isBest ? "text-lg" : "text-base"}`}
                >
                  {cardItem?.title}
                </p>
                <p
                  className={`${
                    item?.isBest && item?.features?.length - 1 === index
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
        <div className="mt-5 mb-3 block">
          {isLink ? (
            <Link
              href={`/processing-page?priceId=${item.priceId}`}
              className="text-white font-semibold whitespace-nowrap text-sm px-6 py-4 rounded-lg w-full scale-1 hover:scale-[1.05] transition-all duration-300 bg-primary"
            >
              {item.linkTitle}
            </Link>
          ) : (
            <CheckoutButton disabled={disabled} priceId={item.priceId} />
          )}
        </div>
        <p
          className={`text-center text-[#7B7E83] dark:text-[#4D525A] ${
            item?.isBest ? "text-lg" : "text-base"
          }`}
        >
          Pay once. Forever access.
          <br />
          Ship unlimited projects!
        </p>
      </div>
      {item?.isBest && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1AAB12] text-white text-lg font-bold rounded-[8px] px-6 py-3 uppercase">
          Best deal
        </div>
      )}
    </div>
  );
};

export default PriceItem;

// Code backup

// "use client";

// import React, { FC } from "react";
// import { Check, X } from "lucide-react";
// import Link from "next/link";
// import CheckoutButton from "./CheckoutButton";

// interface PriceItemProps {
//   item: StripeProduct;
//   isLink?: boolean;
//   disabled?: boolean;
// }

// const PriceItem: FC<PriceItemProps> = ({
//   item,
//   isLink = false,
//   disabled = false,
// }) => {
//   console.log(item, "pricing cards");
//   const isSubscription = item.type === "subscription";

//   return (
//     <div
//       className={`bg-white rounded-lg shadow-md p-8 ${
//         item?.isBest ? "border-4 border-blue-500 relative" : ""
//       }`}
//     >
//       {item?.isBest && (
//         <div className="absolute top-0 right-0 bg-blue-500 text-white py-1 px-4 rounded-bl-lg text-sm font-semibold">
//           Best Value
//         </div>
//       )}
//       <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
//       <p className="text-4xl font-bold mb-2">
//         ${item.price}
//         <span className="text-xl text-gray-500 font-normal">
//           /{isSubscription ? (item as StripePlan).period : "one-time"}
//         </span>
//       </p>
//       {item.subtitle && (
//         <p className="text-green-600 font-semibold mb-6">{item.subtitle}</p>
//       )}
//       <ul className="space-y-3 mb-8">
//         {item.features.map((feature, index) => (
//           <li key={index} className="flex items-center">
//             {feature.disabled ? (
//               <X className="text-red-500 mr-2" />
//             ) : (
//               <Check className="text-green-500 mr-2" />
//             )}
//             <span className={feature.disabled ? "text-gray-400" : ""}>
//               {feature.title}
//             </span>
//           </li>
//         ))}
//       </ul>
//       {isLink ? (
//         <Link
//           href={`/processing-page?priceId=${item.priceId}`}
//           className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
//         >
//           {item.linkTitle}
//         </Link>
//       ) : (
//         <CheckoutButton disabled={disabled} priceId={item.priceId} />
//       )}
//     </div>
//   );
// };

// export default PriceItem;
