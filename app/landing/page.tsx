"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Robust dynamic import for Interactive SVG Hero
const InteractiveHero = dynamic(
  () => import("../components/InteractiveHero").then((mod) => mod.InteractiveHero),
  { ssr: false }
);
import { TransactionSimulation } from "../components/TransactionSimulation";
import { GridBackground } from "../components/GridBackground";
import {
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Code,
  ArrowRight,
  Play,
  CreditCard,
  CheckCircle,
  Wallet,
  BarChart3,
  Lock,
} from "lucide-react";

// Navigation
const Nav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md">
          <span className="font-serif text-xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">P</span>
        </div>
        <span className="font-bold text-lg text-[#022c22] tracking-tight">Portion</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          How it works
        </a>
        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Features
        </a>
        <a href="/dashboard">
          <Button variant="default" size="sm">
            Launch App
          </Button>
        </a>
      </div>
    </div>
  </nav>
);

// Hero Section
// Hero Section
const Hero = () => (
  <section className="relative h-[95vh] flex flex-col items-center justify-start overflow-hidden bg-[#f0fdf4]">
    {/* Text Layer - Positioned Higher */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-3xl mx-auto text-center relative z-20 pt-32 pointer-events-none"
    >
      <h1 className="text-3xl md:text-5xl font-black text-[#022c22] leading-tight mb-4 tracking-tighter">
        Spend Yield.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#10b981] drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          Keep Principal.
        </span>
      </h1>
      <p className="text-base text-[#065f46] max-w-lg mx-auto mb-8 leading-relaxed font-medium">
        Portion automatically detects yield from your USDV holdings. 
        Authorise your agents to spend earnings on autopilot.
      </p>
      <div className="flex items-center justify-center">
        <Button size="lg" className="h-10 px-8 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 pointer-events-auto">
          Get Started
        </Button>
      </div>
    </motion.div>

    {/* Interactive SVG Layer - Positioned Lower to separate from text */}
    <div className="absolute inset-x-0 bottom-0 h-[65vh] z-10">
      <InteractiveHero />
    </div>
  </section>
);



// How it Works
const HowItWorks = () => (
  <section id="how-it-works" className="py-24 px-6 relative overflow-hidden bg-emerald-50/20">
    {/* Mercantill-style Grid reveal background - Light Theme */}
    <GridBackground />
    
    <div className="max-w-6xl mx-auto relative z-10 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-black text-[#022c22] mb-4">
          See it in action
        </h2>
        <p className="text-lg text-[#065f46] max-w-2xl mx-auto font-medium">
          Portion enables seamless x402 payments powered by your harvested yield. 
          Manage policies, connect agents, and watch your yield work.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mb-16 pointer-events-auto">
        {[
          {
            step: "1",
            icon: Wallet,
            title: "Connect Wallet",
            desc: "Link your wallet holding USDV. Portion instantly calculates your available YaaS yield capacity.",
          },
          {
            step: "2",
            icon: Zap,
            title: "Detect Yield",
            desc: "The app identifies your real-time yield generation from the Solomon ecosystem automatically.",
          },
          {
            step: "3",
            icon: CreditCard,
            title: "Spend Autonomously",
            desc: "Enable your AI agents to spend your yield on APIs and infrastructure through x402 payments.",
          },
        ].map((item, i) => (
          <motion.div 
            key={item.step} 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-2xl p-8 h-full border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold mb-6 shadow-lg shadow-emerald-500/20">
                {item.step}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#022c22] mb-3">{item.title}</h3>
              <p className="text-[#065f46] leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="pointer-events-auto"
      >
        <TransactionSimulation />
      </motion.div>
    </div>
  </section>
);

// Features
const Features = () => (
  <section id="features" className="py-24 px-6 bg-white">
    <div className="max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-black text-[#022c22] mb-4">
          Built for the yield economy
        </h2>
        <p className="text-lg text-[#065f46] max-w-2xl mx-auto font-medium">
          Everything you need to turn passive yield into active spending power
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Clock,
            title: "Autonomous Settlement",
            desc: "Yield is allocated directly into service tunnels with sub-100ms finality, bypassing traditional settlement delays.",
          },
          {
            icon: Shield,
            title: "Programmatic Policy",
            desc: "Enforce smart spending rules. Program exactly how your agents use harvested yield for APIs and infrastructure.",
          },
          {
            icon: Lock,
            title: "x402 Tunneling",
            desc: "Privacy-first yield payments via the x402 protocol. Your automated spending stays encrypted and confidential.",
          },
          {
            icon: Users,
            title: "Direct Merchant Pay",
            desc: "Connect multiple yield sources—sUSDV, YaaS, or LP rewards—to pay any x402-enabled service.",
          },
          {
            icon: TrendingUp,
            title: "Principal Preservation",
            desc: "Your core capital remains untouched. Only real-time yield is authorized for automated expenditure.",
          },
          {
            icon: Code,
            title: "Agentic Payments",
            desc: "Power your AI agents with a self-funding wallet. Sub-100ms latency for real-time digital services.",
          },
        ].map((feature, i) => (
          <motion.div 
            key={feature.title} 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i % 3) * 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 border border-emerald-100 hover:border-emerald-300 transition-colors shadow-sm text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 mx-auto">
              <feature.icon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-[#022c22] mb-2">{feature.title}</h3>
            <p className="text-sm text-[#065f46] font-medium leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// CTA Section
const CTA = () => (
  <motion.section 
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="py-24 px-6 bg-emerald-50/30"
  >
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Ready to spend your yield?
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Join early adopters building the future of yield-powered payments
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full h-12 px-4 bg-white border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <Button variant="success" size="lg" className="w-full sm:w-auto whitespace-nowrap">
          Request Access
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        No spam. We'll notify you when Portion launches.
      </p>
    </div>
  </motion.section>
);

// Footer
const Footer = () => (
  <footer className="py-12 px-6 border-t border-border bg-white">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="font-semibold text-foreground">Portion</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="mailto:hello@portion.app" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 Portion. Built on Solomon.
      </p>
    </div>
  </footer>
);

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
