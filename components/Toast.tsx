"use client";

import { AnimatePresence, motion } from "framer-motion";

export type ToastData = {
  open: boolean;
  message: string;
};

export function Toast({ open, message }: ToastData) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-x-0 top-5 z-[1300] flex justify-center px-4"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div className="w-[min(92vw,520px)] rounded-3xl border border-white/45 bg-white/45 px-5 py-4 text-center shadow-[0_20px_50px_rgba(25,50,80,0.18)] backdrop-blur-xl ring-1 ring-white/35">
            <p className="text-sm font-extrabold text-slate-800 sm:text-base">
              {message}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
