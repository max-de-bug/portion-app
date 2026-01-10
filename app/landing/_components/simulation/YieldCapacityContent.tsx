"use client";

import { memo, useRef, useMemo, useEffect } from "react";
import { motion, useInView, useSpring, useMotionValue, animate } from "framer-motion";
import { Zap, Shield } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface YieldCapacityContentProps {
  limitUsage: number;
}

/**
 * YieldCapacityContent - Extracted and memoized for performance.
 * Displays yield allocation and efficiency metrics with animated progress bar.
 */
export const YieldCapacityContent = memo(function YieldCapacityContent({ 
  limitUsage 
}: YieldCapacityContentProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const progressWidth = useMotionValue(0);
  const progressSpring = useSpring(progressWidth, { damping: 20, stiffness: 90 });
  const prefersReducedMotion = useReducedMotion();

  // Animate progress when in view
  useEffect(() => {
    if (isInView && !prefersReducedMotion) {
      animate(progressWidth, limitUsage, { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] });
    } else if (isInView) {
      // Instant for reduced motion
      progressWidth.set(limitUsage);
    }
  }, [isInView, limitUsage, progressWidth, prefersReducedMotion]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }), [prefersReducedMotion]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  }), [prefersReducedMotion]);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="text-lg font-bold text-foreground">YaaS Yield Capacity</h3>
        </div>
        <motion.span
          animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="px-3 py-1 rounded-full bg-success/20 text-success text-[10px] font-black tracking-tighter"
        >
          100% UTILIZED
        </motion.span>
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <div className="flex justify-between text-xs mb-3 font-bold">
            <span className="text-muted-foreground">Allocated for Payments</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="text-primary"
            >
              {limitUsage}%
            </motion.span>
          </div>
          <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-border/20 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full shadow-[0_0_10px_rgba(0,163,255,0.4)] relative"
              style={{ width: progressSpring }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${limitUsage}%` } : { width: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="p-5 rounded-xl bg-background/40 border border-border/20"
          >
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
              Yield Source
            </span>
            <span className="text-base font-bold text-foreground flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={prefersReducedMotion ? {} : { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              Solomon YaaS
            </span>
          </motion.div>
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="p-5 rounded-xl bg-background/40 border border-border/20"
          >
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">
              Efficiency
            </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="text-base font-mono font-bold text-primary"
            >
              99.9%
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-5 rounded-xl border border-dashed border-border/60 bg-primary/5 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, -8, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-3"
            >
              <Shield className="w-10 h-10 text-primary mx-auto" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.8 }}
              className="text-sm font-bold text-foreground"
            >
              Autonomous Authorization
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.9 }}
              className="text-xs text-muted-foreground"
            >
              Signed via Portion Vault
            </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
