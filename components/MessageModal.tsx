"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { GiftColor, ItemType } from "@/utils/supabase";
import { GIFT_DESIGNS, ORNAMENT_DESIGNS } from "@/utils/itemAssets";
import {
  getOrnamentQuestion,
  CATEGORY_LABELS,
} from "@/utils/ornamentQuestions";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultItemType?: ItemType;
  defaultItemDesign?: string;
  defaultGiftColor?: GiftColor;
  hostName?: string;
  onSubmit: (data: {
    sender_name: string;
    content: string;
    gift_color: GiftColor;
    item_type: ItemType;
    item_design: string;
    question_category?: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

const COLORS: { key: GiftColor; label: string; tw: string; ring: string }[] = [
  {
    key: "red",
    label: "Red",
    tw: "bg-christmas-red",
    ring: "ring-christmas-red/35",
  },
  {
    key: "green",
    label: "Green",
    tw: "bg-christmas-green",
    ring: "ring-christmas-green/35",
  },
  {
    key: "yellow",
    label: "Yellow",
    tw: "bg-[#F6C64E]",
    ring: "ring-[#F6C64E]/35",
  },
];

export function MessageModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  defaultItemType,
  defaultItemDesign,
  defaultGiftColor,
  hostName,
}: Props) {
  const [senderName, setSenderName] = useState("");
  const [content, setContent] = useState("");
  const [giftColor, setGiftColor] = useState<GiftColor>("red");
  const [itemType, setItemType] = useState<ItemType>("ornament");
  const [itemDesign, setItemDesign] = useState<string>("sock");
  const [error, setError] = useState<string | null>(null);

  // 오너먼트 질문을 안정적으로 선택하기 위한 시드 (itemDesign 변경 시에만 새로 계산)
  const [ornamentQuestionSeed, setOrnamentQuestionSeed] = useState<
    string | null
  >(null);

  // itemDesign이 변경될 때만 새로운 시드 생성
  useEffect(() => {
    if (itemType === "ornament" && itemDesign) {
      setOrnamentQuestionSeed(`${itemDesign}-${Date.now()}`);
    } else {
      setOrnamentQuestionSeed(null);
    }
  }, [itemType, itemDesign]);

  // 질문을 안정적으로 계산 (시드가 변경될 때만 재계산)
  const ornamentQuestion = useMemo(() => {
    if (itemType !== "ornament" || !ornamentQuestionSeed) return null;
    return getOrnamentQuestion(itemDesign, hostName, ornamentQuestionSeed);
  }, [itemType, itemDesign, hostName, ornamentQuestionSeed]);

  const canSubmit = useMemo(() => {
    const nameOk =
      senderName.trim().length >= 1 && senderName.trim().length <= 20;
    const contentOk =
      content.trim().length >= 1 && content.trim().length <= 200;
    return nameOk && contentOk && !isSubmitting;
  }, [senderName, content, isSubmitting]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    // 모달을 "열 때"만 기본값 반영 (사용자가 입력하는 도중에는 건드리지 않음)
    if (defaultItemType) {
      setItemType(defaultItemType);
      if (defaultItemType === "gift") {
        const c = defaultGiftColor ?? "red";
        setGiftColor(c);
        setItemDesign(defaultItemDesign ?? c);
      } else {
        setItemDesign(defaultItemDesign ?? "sock");
      }
    }
  }, [open, defaultItemType, defaultItemDesign, defaultGiftColor]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleSubmit() {
    setError(null);
    try {
      await onSubmit({
        sender_name: senderName.trim(),
        content: content.trim(),
        gift_color: giftColor,
        item_type: itemType,
        item_design: itemDesign,
        question_category: ornamentQuestion?.category ?? null,
      });
      setSenderName("");
      setContent("");
      setGiftColor("red");
      setItemType("ornament");
      setItemDesign("sock");
      onClose();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "전송에 실패했어요. 잠시 후 다시 시도해 주세요."
      );
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-5 py-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="close modal"
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-slate-900/30 backdrop-blur-sm"
          />

          {/* panel */}
          <motion.div
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={[
              "relative w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-[34px] border border-white/45 bg-white/35 p-5 shadow-[0_30px_80px_rgba(25,50,80,0.20)] backdrop-blur-xl sm:p-7 my-auto",
              "ring-1 ring-white/35 overflow-y-auto",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/40 to-transparent opacity-70" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-slate-800">
                    {itemType === "ornament" ? "오너먼트 달기" : "선물 주기"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {itemType === "ornament"
                      ? "질문에 답하고, 트리에 오너먼트를 달아줘."
                      : "트리 아래에 선물을 놓고, 하고 싶은 말을 남겨줘."}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="rounded-2xl bg-white/40 px-3 py-2 text-sm font-bold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 transition-all duration-200 hover:bg-white/50 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_12px_20px_rgba(25,50,80,0.12)]"
                >
                  닫기
                </motion.button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    꾸미기 아이템
                  </label>

                  {/* Type toggle */}
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setItemType("ornament");
                        setItemDesign("sock");
                      }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className={[
                        "relative rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-left shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] transition-all duration-200",
                        itemType === "ornament"
                          ? "ring-2 ring-skyPastel-300/60 bg-white/55"
                          : "ring-1 ring-white/40",
                      ].join(" ")}
                    >
                      <div className="text-sm font-extrabold text-slate-800">
                        오너먼트
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-600">
                        트리 위에 걸려요
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => {
                        setItemType("gift");
                        setItemDesign("red");
                        setGiftColor("red");
                      }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className={[
                        "relative rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-left shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] transition-all duration-200",
                        itemType === "gift"
                          ? "ring-2 ring-skyPastel-300/60 bg-white/55"
                          : "ring-1 ring-white/40",
                      ].join(" ")}
                    >
                      <div className="text-sm font-extrabold text-slate-800">
                        선물 상자
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-600">
                        트리 아래에 쌓여요
                      </div>
                    </motion.button>
                  </div>

                  {/* Design picker */}
                  <div className="mt-3">
                    <div className="text-xs font-extrabold text-slate-600">
                      디자인 선택
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {itemType === "ornament"
                        ? ORNAMENT_DESIGNS.map((o) => (
                            <motion.button
                              key={o.key}
                              type="button"
                              onClick={() => setItemDesign(o.key)}
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                              }}
                              className={[
                                "relative h-14 w-14 rounded-3xl border border-white/50 bg-white/40 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_12px_20px_rgba(25,50,80,0.12)] transition-all duration-200",
                                itemDesign === o.key
                                  ? "ring-2 ring-skyPastel-300/60 shadow-lg"
                                  : "ring-1 ring-white/35 hover:border-white/60 hover:shadow-md",
                              ].join(" ")}
                              aria-label={o.key}
                            >
                              <span className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/35 to-transparent opacity-80" />
                              <span className="pointer-events-none absolute inset-2">
                                <img
                                  src={`/images/${o.fileBase}.png`}
                                  alt={o.key}
                                  className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(25,50,80,0.16)]"
                                />
                              </span>
                            </motion.button>
                          ))
                        : GIFT_DESIGNS.map(
                            ({ fileBase, giftColor: c, key }) => (
                              <motion.button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setItemDesign(key);
                                  setGiftColor(c);
                                }}
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25,
                                }}
                                className={[
                                  "relative h-14 w-14 rounded-3xl border border-white/50 bg-white/40 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_12px_20px_rgba(25,50,80,0.12)] transition-all duration-200",
                                  itemDesign === key
                                    ? "ring-2 ring-skyPastel-300/60 shadow-lg"
                                    : "ring-1 ring-white/35 hover:border-white/60 hover:shadow-md",
                                ].join(" ")}
                                aria-label={key}
                              >
                                <span className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/35 to-transparent opacity-80" />
                                <span className="pointer-events-none absolute inset-2">
                                  <img
                                    src={`/images/${fileBase}.png`}
                                    alt={key}
                                    className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(25,50,80,0.16)]"
                                  />
                                </span>
                              </motion.button>
                            )
                          )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    닉네임
                  </label>
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="예) 산타요정"
                    maxLength={20}
                    className="mt-2 w-full rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50 focus:shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_30px_rgba(25,50,80,0.15)] focus:bg-white/55"
                  />
                </div>
                <div>
                  {itemType === "ornament" ? (
                    <>
                      <label className="text-sm font-extrabold text-slate-700">
                        질문
                      </label>
                      {ornamentQuestion ? (
                        <div className="mt-2 rounded-3xl border border-white/50 bg-white/45 px-4 py-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-base font-extrabold leading-relaxed text-slate-800 flex-1">
                              {ornamentQuestion.question}
                            </div>
                            <span className="flex-shrink-0 rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {CATEGORY_LABELS[ornamentQuestion.category]}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <label className="mt-4 block text-sm font-extrabold text-slate-700">
                        답변
                      </label>
                    </>
                  ) : (
                    <label className="text-sm font-extrabold text-slate-700">
                      너에게 하고 싶은 말
                    </label>
                  )}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      itemType === "ornament"
                        ? "여기에 답을 적어줘 (최대 200자)"
                        : "지금 하고 싶은 말을 자유롭게 적어줘 (최대 200자)"
                    }
                    maxLength={200}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-slate-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_14px_26px_rgba(25,50,80,0.10)] outline-none placeholder:text-slate-500 transition-all duration-200 focus:border-white/70 focus:ring-2 focus:ring-skyPastel-300/50 focus:shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_30px_rgba(25,50,80,0.15)] focus:bg-white/55"
                  />
                  <div className="mt-1 text-right text-xs font-semibold text-slate-500">
                    {content.trim().length}/200
                  </div>
                </div>

                {error ? (
                  <div className="rounded-3xl border border-white/50 bg-white/45 px-4 py-3 text-sm font-bold text-christmas-red shadow-[inset_0_2px_0_rgba(255,255,255,0.55)]">
                    {error}
                  </div>
                ) : null}
                <div className="pt-1">
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    whileHover={
                      canSubmit
                        ? {
                            y: -2,
                            scale: 1.01,
                            boxShadow: "0 20px 40px rgba(34, 139, 98, 0.3)",
                          }
                        : undefined
                    }
                    whileTap={canSubmit ? { y: 0, scale: 0.98 } : undefined}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={[
                      "relative w-full select-none rounded-clay px-7 py-4 text-lg font-extrabold tracking-tight text-white",
                      "bg-gradient-to-b from-christmas-green to-[#239B62]",
                      "shadow-clay shadow-clayInset ring-1 ring-white/35 transition-all duration-200 ease-out",
                      canSubmit
                        ? "opacity-100 cursor-pointer"
                        : "opacity-60 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
                    <span className="relative">
                      {isSubmitting ? "보내는 중..." : "보내기"}
                    </span>
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
