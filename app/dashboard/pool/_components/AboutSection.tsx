"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronDown, Target, Zap, Shield } from "lucide-react";

/**
 * Collapsible section explaining concentrated liquidity.
 * Extracted to reduce core page complexity.
 */
export const AboutSection = memo(() => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-3xl bg-gradient-to-br from-white/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl overflow-hidden"
    >
      <button
        onClick={() => setShowAbout(!showAbout)}
        className="w-full p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-1">About Concentrated Liquidity</h2>
            <p className="text-muted-foreground text-sm">
              {showAbout ? "Hide detailed guide" : "Click to learn how zero-slippage trades work"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: showAbout ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6 text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="px-8 pb-8 space-y-8">
              <div className="pt-6 border-t border-white/10">
                <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                  Concentrated Liquidity Pools allow you to provide liquidity within specific price ranges, enabling 
                  <strong className="text-foreground"> zero-slippage trades</strong> within price bins.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Concentrated Liquidity</h4>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Provide liquidity in specific price ranges for higher capital efficiency
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Zero Slippage</h4>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Trades within the same bin experience no slippage at all
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Dynamic Fees</h4>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Fees adjust based on market volatility to protect LPs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AboutSection.displayName = "AboutSection";
