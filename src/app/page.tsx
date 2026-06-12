"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Services from "@/components/Services";
import TrustSafety from "@/components/TrustSafety";
import PaymentProtection from "@/components/PaymentProtection";
import Compare from "@/components/Compare";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";

export default function Home() {
  useEffect(() => {
    // Replicate the scroll reveal intersection observer from the static main.js
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Add visible class with a staggered delay
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header variant="landing" theme="light" />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <HowItWorks />
        <Services />
        <TrustSafety />
        <PaymentProtection />
        <Compare />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
