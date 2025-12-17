"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1200] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="close confirm modal"
            onClick={onCancel}
            className="absolute inset-0 cursor-default bg-slate-900/35 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/45 bg-white/35 p-6 shadow-[0_30px_80px_rgba(25,50,80,0.20)] backdrop-blur-xl ring-1 ring-white/35"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
            <div className="relative">
              <p className="text-lg font-extrabold tracking-tight text-slate-800">
                {title}
              </p>
              {description ? (
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                  {description}
                </p>
              ) : null}

              <div className="mt-5 flex gap-3">
                <motion.button
                  type="button"
                  onClick={onCancel}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-2xl bg-white/45 px-4 py-3 text-sm font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_12px_20px_rgba(25,50,80,0.12)] ring-1 ring-white/45"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onConfirm}
                  whileTap={{ scale: 0.98 }}
                  className={[
                    "flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold text-white",
                    danger
                      ? "bg-gradient-to-b from-christmas-red to-[#D73C3C]"
                      : "bg-gradient-to-b from-christmas-green to-[#239B62]",
                    "shadow-clay shadow-clayInset ring-1 ring-white/35",
                  ].join(" ")}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


