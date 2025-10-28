"use client";

import React, { useState, useEffect } from "react";
import { Heading } from "@/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const StaticData = {
	title: "Frequently Asked Questions",
	below_title: "Have another question? Contact us.",
	faqs: [
		{
			id: 1,
			question: "Is OpenFund an accounting tool?",
			answer:
				"It is not bookkeeping software. OpenFund delivers financial insight and transparency alongside your existing accounting stack.",
		},
		{
			id: 2,
			question: "Can I use it for multiple projects or funds?",
			answer: "Yes. You can create and track multiple accounts or fundraisers separately inside OpenFund.",
		},
		{
			id: 3,
			question: "Can I share my financial overview publicly?",
			answer:
				"Absolutely. Each account can publish a secure public page that shows donors exactly how funds are raised and spent.",
		},
		{
			id: 4,
			question: "Where does my data come from?",
			answer:
				"You upload your bank statements or ledger CSV files. OpenFund ingests and categorizes the transactions automatically.",
		},
		{
			id: 5,
			question: "Do I need accounting experience?",
			answer:
				"Not at all. OpenFund is built for everyday teams running real community work, not accountants.",
		},
	],
};

const Faq = ({ data, isHomePage }: any) => {
  const StaticFAQs = StaticData.faqs;
  const faqData = data?.length > 0 ? data : StaticFAQs;

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Avoid rendering until after the initial mount
  }

  return (
    <div id="faq" className="flex justify-center items-center bg-white dark:bg-[#010814] my-16 w-full">
      <div className="max-w-[1440px] w-full px-4 sm:px-12">
        {isHomePage && (
          <div className="max-w-[624px] mx-auto mb-16">
            <Heading
              title="Frequently Asked Questions"
              desc="Have another question? Contact us."
            />
          </div>
        )}
        <div>
          <Accordion defaultValue={["item-0"]} type="multiple">
            {faqData?.map((item: any, index: number) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="shadow-2xl dark:shadow-none border dark:border-[#373C53] py-2 px-6 rounded-[12px] bg-white dark:bg-gradient-to-r from-[#1E242D] to-[#0B111B] h-full transition-all duration-300 mb-4"
              >
                <AccordionTrigger className="text-start font-semibold text-xl hover:no-underline">
                  {item?.question}
                </AccordionTrigger>
                <AccordionContent className="mt-2">
                  <div className="text-[#010610A6] dark:text-[#808389] font-medium text-base sm:mr-12 mb-4">
                    <div dangerouslySetInnerHTML={{ __html: item?.answer }} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Faq;
