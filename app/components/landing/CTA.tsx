"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const CTA = () => (
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
