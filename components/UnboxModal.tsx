"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { MessageRow } from "@/utils/supabase";
import type { ItemType } from "@/utils/supabase";
import { resolveItemFileBase } from "@/utils/itemAssets";
import {
  getOrnamentQuestion,
  CATEGORY_LABELS,
} from "@/utils/ornamentQuestions";

type Props = {
  open: boolean;
  locked: boolean;
  message: MessageRow | null;
  hostName?: string;
  onClose: () => void;
};

export function UnboxModal({
  open,
  locked,
  message,
  hostName,
  onClose,
}: Props) {
  const [stage, setStage] = useState<"wrapped" | "unwrapped">("wrapped");

  const itemType = useMemo(() => {
    return (message?.item_type ?? "ornament") as ItemType;
  }, [message?.item_type]);

  const ornamentQ = useMemo(() => {
    if (itemType !== "ornament") return null;
    return getOrnamentQuestion(
      message?.item_design ?? "sock",
      hostName,
      message?.id ? String(message.id) : undefined
    );
  }, [itemType, message?.item_design, message?.id, hostName]);

  const itemSrc = useMemo(() => {
    const fileBase = resolveItemFileBase({
      itemType,
      itemDesign: message?.item_design,
      giftColor: message?.gift_color,
    });
    return `/images/${fileBase}.png`;
  }, [itemType, message?.item_design, message?.gift_color]);

  useEffect(() => {
    if (!open) return;
    // 모달 열릴 때마다 리셋
    // - ornament: 포장 없이 바로 메시지(=unwrapped)로
    // - gift: 포장(=wrapped)부터
    setStage(itemType === "gift" ? "wrapped" : "unwrapped");
  }, [open, message?.id]);

  const canUnwrap = !locked && Boolean(message);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center px-5 py-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="close unbox modal"
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-slate-900/35 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-6 shadow-[0_30px_80px_rgba(25,50,80,0.20)] backdrop-blur-xl ring-1 ring-white/35 sm:p-8 my-auto"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-slate-800">
                    {locked
                      ? "크리스마스에 열어볼 수 있어요!"
                      : itemType === "gift"
                      ? stage === "wrapped"
                        ? "선물 포장을 열어볼까?"
                        : "언박싱 완료!"
                      : "메시지"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {locked
                      ? "산타가 아직 봉인해뒀어요. D-Day가 되면 열어볼 수 있어요."
                      : itemType === "gift"
                      ? stage === "wrapped"
                        ? "리본을 풀고, 포장을 살짝 뜯어보자."
                        : "따뜻한 메시지가 도착했어요."
                      : "따뜻한 메시지가 도착했어요."}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-white/40 px-3 py-2 text-sm font-bold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45"
                >
                  닫기
                </motion.button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
                <motion.div
                  initial={{ rotate: -6, y: 6, scale: 0.98 }}
                  animate={{ rotate: 6, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32"
                >
                  <div className="absolute inset-0 rounded-[28px] bg-white/40 shadow-[inset_0_2px_0_rgba(255,255,255,0.65),_0_18px_30px_rgba(25,50,80,0.14)] ring-1 ring-white/45" />
                  <Image
                    src={itemSrc}
                    alt={itemType === "gift" ? "gift" : "ornament"}
                    fill
                    sizes="128px"
                    className="p-4 object-contain drop-shadow-[0_22px_22px_rgba(25,50,80,0.18)]"
                  />
                  <div className="absolute -right-2 -top-2 rounded-full bg-white/55 px-2 py-1 text-[11px] font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md">
                    🎅
                  </div>
                </motion.div>

                <div className="rounded-3xl border border-white/45 bg-white/45 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_26px_rgba(25,50,80,0.10)]">
                  {/* Wrapped stage */}
                  <AnimatePresence initial={false}>
                    {stage === "wrapped" ? (
                      <motion.div
                        key="wrapped"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-extrabold text-slate-600">
                              {itemType === "gift" ? "Gift" : "Ornament"}
                            </div>
                            <div className="mt-1 text-lg font-extrabold text-slate-800">
                              {message?.sender_name ?? "익명"}의 포장
                            </div>
                          </div>
                          {itemType === "gift" ? (
                            <motion.button
                              type="button"
                              disabled={!canUnwrap}
                              whileTap={canUnwrap ? { scale: 0.98 } : undefined}
                              onClick={() => setStage("unwrapped")}
                              className={[
                                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white",
                                "bg-gradient-to-b from-christmas-green to-[#239B62]",
                                "shadow-clay shadow-clayInset ring-1 ring-white/35",
                                canUnwrap ? "opacity-100" : "opacity-60",
                              ].join(" ")}
                            >
                              열기
                            </motion.button>
                          ) : null}
                        </div>

                        <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/45 bg-white/35 p-4">
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-80" />

                          <div className="relative mx-auto h-20 w-20">
                            <Image
                              src={itemSrc}
                              alt="wrapped item"
                              fill
                              sizes="96px"
                              className="object-contain drop-shadow-[0_16px_16px_rgba(25,50,80,0.18)]"
                            />
                          </div>

                          {/* “포장지” 오버레이 (언박싱 애니메이션) - gift 전용 */}
                          {!locked && itemType === "gift" ? (
                            <motion.div
                              key="wrap-overlay"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              className="pointer-events-none absolute inset-0"
                            >
                              <motion.div
                                className="absolute inset-0"
                                initial={false}
                                animate={
                                  stage === "wrapped"
                                    ? { opacity: 1 }
                                    : { opacity: 0 }
                                }
                                transition={{ duration: 0.25 }}
                                style={{
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.18))",
                                }}
                              />
                              <motion.div
                                className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2"
                                style={{
                                  background:
                                    "linear-gradient(180deg, rgba(232,76,76,0.95), rgba(215,60,60,0.95))",
                                }}
                                initial={false}
                                animate={
                                  stage === "wrapped"
                                    ? { scaleY: 1 }
                                    : { scaleY: 0 }
                                }
                                transition={{
                                  duration: 0.35,
                                  ease: "easeInOut",
                                }}
                              />
                              <motion.div
                                className="absolute left-0 top-1/2 h-8 w-full -translate-y-1/2"
                                style={{
                                  background:
                                    "linear-gradient(90deg, rgba(232,76,76,0.95), rgba(215,60,60,0.95))",
                                }}
                                initial={false}
                                animate={
                                  stage === "wrapped"
                                    ? { scaleX: 1 }
                                    : { scaleX: 0 }
                                }
                                transition={{
                                  duration: 0.35,
                                  ease: "easeInOut",
                                }}
                              />
                            </motion.div>
                          ) : null}
                        </div>

                        {locked ? (
                          <div className="mt-3 rounded-2xl bg-white/50 px-3 py-2 text-xs font-extrabold text-slate-700">
                            🎄 12월 24일 이후에 열 수 있어요 (또는 호스트 모드)
                          </div>
                        ) : itemType === "gift" ? (
                          <div className="mt-3 text-xs font-semibold text-slate-600">
                            “열기”를 누르면 포장이 벗겨지고 메시지가 공개돼요.
                          </div>
                        ) : null}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="unwrapped"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-extrabold text-slate-600">
                              보낸 사람
                            </div>
                            <div className="mt-1 text-lg font-extrabold text-slate-800">
                              {message?.sender_name ?? "익명"}
                            </div>
                          </div>
                          {itemType === "gift" ? (
                            <motion.button
                              type="button"
                              onClick={() => setStage("wrapped")}
                              whileTap={{ scale: 0.98 }}
                              className="rounded-2xl bg-white/40 px-3 py-2 text-sm font-bold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45"
                            >
                              다시 포장
                            </motion.button>
                          ) : null}
                        </div>

                        {itemType === "ornament" && ornamentQ ? (
                          <div className="mt-4 rounded-3xl border border-white/45 bg-white/45 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_26px_rgba(25,50,80,0.10)]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-[15px] font-extrabold leading-relaxed text-slate-800 flex-1">
                                {ornamentQ.question}
                              </div>
                              <span className="flex-shrink-0 rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {CATEGORY_LABELS[ornamentQ.category]}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 text-xs font-extrabold text-slate-600">
                          {itemType === "ornament" ? "답변" : "하고 싶은 말"}
                        </div>
                        <div className="mt-1 rounded-3xl border border-white/45 bg-white/40 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_24px_rgba(25,50,80,0.10)]">
                          <div className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-800">
                            {message?.content ?? ""}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
