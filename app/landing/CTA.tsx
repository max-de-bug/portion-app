"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export const CTA = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
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
        
        {status === "success" ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-emerald-100 rounded-xl max-w-md mx-auto text-emerald-800"
          >
            <p className="font-semibold text-lg">You're on the list! 🎉</p>
            <p className="text-sm mt-1">We'll verify your eligibility for early access soon.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
              className="w-full h-12 px-4 bg-white border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <Button 
              type="submit" 
              variant="default" 
              size="lg" 
              className="w-full sm:w-auto whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Joining..." : "Request Access"}
            </Button>
          </form>
        )}
        
        {status !== "success" && (
          <p className="text-xs text-muted-foreground mt-4">
            No spam. We'll notify you when Portion launches.
          </p>
        )}
      </div>
    </motion.section>
  );
};
