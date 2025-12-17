"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export type HostProfile = {
  name: string;
  gender: "female" | "male" | "nonbinary" | "other";
  age: number;
  treeStyle: string; // e.g. "tree1.png" | "tree2.png" | "tree3.png"
};

type Props = {
  open: boolean;
  initial?: Partial<HostProfile>;
  availableTreeStyles: { key: string; label: string; previewSrc: string }[];
  onClose?: () => void;
  onComplete: (profile: HostProfile) => void;
};

export function OnboardingModal({
  open,
  initial,
  availableTreeStyles,
  onClose,
  onComplete,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<HostProfile["gender"]>(
    initial?.gender ?? "other"
  );
  const [age, setAge] = useState<number>(initial?.age ?? 20);
  const [treeStyle, setTreeStyle] = useState<string>(
    initial?.treeStyle ?? availableTreeStyles[0]?.key ?? "tree1.png"
  );

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setGender(initial?.gender ?? "other");
    setAge(initial?.age ?? 20);
    setTreeStyle(
      initial?.treeStyle ?? availableTreeStyles[0]?.key ?? "tree1.png"
    );
  }, [
    open,
    initial?.name,
    initial?.gender,
    initial?.age,
    initial?.treeStyle,
    availableTreeStyles,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canSubmit = useMemo(() => {
    const n = name.trim();
    return (
      n.length >= 1 &&
      n.length <= 12 &&
      age >= 1 &&
      age <= 120 &&
      Boolean(treeStyle)
    );
  }, [name, age, treeStyle]);

  function submit() {
    if (!canSubmit) return;
    onComplete({
      name: name.trim(),
      gender,
      age,
      treeStyle,
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-center justify-center px-5 py-4 overflow-y-auto"
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
            className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-6 shadow-[0_30px_90px_rgba(25,50,80,0.22)] backdrop-blur-xl ring-1 ring-white/35 sm:p-8 my-auto"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-slate-800">
                    내 크리스마스 트리 만들기
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    처음 한 번만 입력하면, 내 트리가 예쁘게 세팅돼.
                  </p>
                </div>
                {onClose ? (
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-white/40 px-3 py-2 text-sm font-bold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45"
                  >
                    닫기
                  </motion.button>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-extrabold text-slate-700">
                    내 이름
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예) 예림"
                    maxLength={12}
                    className="mt-2 w-full rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none placeholder:text-slate-500 focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    성별
                  </label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as HostProfile["gender"])
                    }
                    className="mt-2 w-full rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50"
                  >
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                    <option value="nonbinary">논바이너리</option>
                    <option value="other">기타/비공개</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    나이
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min={1}
                    max={120}
                    className="mt-2 w-full rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-extrabold text-slate-700">
                    트리 모양
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {availableTreeStyles.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTreeStyle(t.key)}
                        className={[
                          "relative overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-3 text-left shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_12px_20px_rgba(25,50,80,0.12)]",
                          treeStyle === t.key
                            ? "ring-2 ring-skyPastel-300/60"
                            : "ring-1 ring-white/35",
                        ].join(" ")}
                        aria-label={t.label}
                      >
                        <div className="text-xs font-extrabold text-slate-700">
                          {t.label}
                        </div>
                        <div className="relative mt-2 aspect-square w-full rounded-2xl bg-white/35 p-2">
                          <Image
                            src={t.previewSrc}
                            alt={t.label}
                            fill
                            sizes="(max-width: 640px) 100vw, 200px"
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  type="button"
                  onClick={submit}
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
                  <span className="relative">내 트리 생성하기</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
