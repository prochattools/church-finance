import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Faq from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Comparison from "@/components/Comparison";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
      <Comparison/>
        <Features />
        <Pricing />
        <Faq />
        <CTA />
      </main>
      <Footer />
    </>
  );
}