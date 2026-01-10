"use client";

import { Check, XCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast, dismissToast, type Toast } from "./use-toast";

const iconMap = {
  success: Check,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styleMap = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const Icon = iconMap[toast.type];

  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm flex items-center gap-2 min-w-[280px] cursor-pointer",
        styleMap[toast.type]
      )}
      onClick={() => dismissToast(toast.id)}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
    </motion.div>
  );
}

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

const positionClasses = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

export function ToastContainer({ position = "top-right" }: ToastContainerProps) {
  const { toasts } = useToast();

  return (
    <div className={cn("fixed z-50 space-y-2", positionClasses[position])}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export { ToastItem };
