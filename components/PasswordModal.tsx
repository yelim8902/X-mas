"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error?: string;
};

export function PasswordModal({ open, onClose, onSubmit, error }: Props) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canSubmit = /^\d{4,6}$/.test(password.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(password.trim());
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1200] flex items-center justify-center px-5 py-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />

          <motion.div
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-6 shadow-[0_30px_90px_rgba(25,50,80,0.22)] backdrop-blur-xl ring-1 ring-white/35 sm:p-8 my-auto"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
            <div className="relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-0 top-0 rounded-full p-2 text-slate-600 transition-colors hover:bg-white/40 hover:text-slate-800"
                aria-label="닫기"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-800">
                트리 관리
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                트리를 만들 때 설정한 비밀번호를 입력해주세요
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setPassword(val);
                    }}
                    placeholder="4-6자리 숫자"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) {
                        handleSubmit();
                      }
                    }}
                    className="mt-2 w-full rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none placeholder:text-slate-500 focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm font-bold text-christmas-red">
                      {error}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    whileHover={canSubmit ? { y: -1 } : undefined}
                    whileTap={canSubmit ? { y: 1, scale: 0.99 } : undefined}
                    className={[
                      "relative w-full select-none rounded-clay px-7 py-4 text-lg font-extrabold tracking-tight text-white",
                      "bg-gradient-to-b from-christmas-red to-[#D73C3C]",
                      "shadow-clay shadow-clayInset ring-1 ring-white/35 transition-[transform,filter,opacity] duration-150 ease-out",
                      "active:shadow-clayPressed active:translate-y-[1px]",
                      canSubmit ? "opacity-100" : "opacity-60",
                    ].join(" ")}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
                    <span className="relative">확인</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

