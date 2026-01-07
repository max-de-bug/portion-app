"use client";

import { motion } from "framer-motion";
import { Clock, Shield, Lock, Users, TrendingUp, Code } from "lucide-react";

export const Features = () => (
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
