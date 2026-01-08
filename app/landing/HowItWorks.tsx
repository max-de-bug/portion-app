"use client";
import { motion } from "framer-motion";
import { Wallet, Zap, CreditCard } from "lucide-react";
import { GridBackground } from "./GridBackground";
import { TransactionSimulation } from "./TransactionSimulation";

export const HowItWorks = () => (
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
