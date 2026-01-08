"use client";

import { Nav } from "./Nav";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { CTA } from "./CTA";
import { Footer } from "./Footer";
import { Hero } from "./Hero/Hero";

// Main Landing Page
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
