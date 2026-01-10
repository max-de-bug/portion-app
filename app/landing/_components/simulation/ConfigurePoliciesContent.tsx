"use client";

import { memo, useRef, useMemo, useEffect } from "react";
import { motion, useInView, useSpring, useMotionValue, animate } from "framer-motion";
import { Shield } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ConfigurePoliciesContentProps {
  limitUsage: number;
}

/**
 * ConfigurePoliciesContent - Extracted and memoized for performance.
 * Displays spending policy configuration cards with animations.
 */
export const ConfigurePoliciesContent = memo(function ConfigurePoliciesContent({
  limitUsage,
}: ConfigurePoliciesContentProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const progressWidth = useMotionValue(0);
  const progressSpring = useSpring(progressWidth, { damping: 25, stiffness: 100 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isInView && !prefersReducedMotion) {
      animate(progressWidth, limitUsage, { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] });
    } else if (isInView) {
      progressWidth.set(limitUsage);
    }
  }, [isInView, limitUsage, progressWidth, prefersReducedMotion]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  }), [prefersReducedMotion]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24, scale: prefersReducedMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  }), [prefersReducedMotion]);

  const policyCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
    },
    hover: {
      scale: 1.02,
      y: -2,
      borderColor: "rgba(59, 130, 246, 0.4)",
      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.1)",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4">
        <motion.div
          animate={prefersReducedMotion ? {} : { rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <Shield className="w-5 h-5 text-primary" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">Configure Policies</h3>
      </motion.div>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Set up spending limits and rules
      </motion.p>

      <div className="space-y-4">
        {/* Daily Spending Limit Policy */}
        <motion.div
          variants={policyCardVariants}
          whileHover="hover"
          className="p-5 rounded-xl bg-background/60 border border-border/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-success"
                animate={prefersReducedMotion ? {} : { opacity: [1, 0.6, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-sm font-bold text-foreground">Daily Spending Limit</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/20 text-success uppercase">
              Active
            </span>
          </div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-muted-foreground">$0</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="text-primary font-bold"
            >
              ${Math.floor(limitUsage * 5)} / $500
            </motion.span>
          </div>
          <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full relative"
              style={{ width: progressSpring }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${limitUsage}%` } : { width: 0 }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  style={{ width: "50%" }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Merchant Whitelist Policy */}
        <motion.div
          variants={policyCardVariants}
          whileHover="hover"
          className="p-5 rounded-xl bg-background/60 border border-border/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-success"
                animate={prefersReducedMotion ? {} : { opacity: [1, 0.6, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-sm font-bold text-foreground">Merchant Whitelist</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/20 text-success uppercase">
              Active
            </span>
          </div>
          <motion.div variants={containerVariants} className="flex flex-wrap gap-2">
            {["OpenAI", "Portion", "AWS", "Anthropic"].map((merchant, idx) => (
              <motion.span
                key={merchant}
                custom={idx}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.08, duration: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1, y: -2 }}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 cursor-pointer"
              >
                {merchant}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.02 }}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground border border-border/20"
            >
              +2 more
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Max Transaction Size */}
        <motion.div
          variants={policyCardVariants}
          whileHover="hover"
          className="p-5 rounded-xl bg-background/60 border border-border/30"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-amber-500"
                animate={prefersReducedMotion ? {} : { opacity: [1, 0.5, 1], scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-sm font-bold text-foreground">Max Transaction Size</span>
            </div>
            <motion.span
              animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 uppercase"
            >
              Pending
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1 }}
            className="text-xs text-muted-foreground"
          >
            Limit: <span className="text-primary font-mono font-bold">$100.00</span> per transaction
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
});
