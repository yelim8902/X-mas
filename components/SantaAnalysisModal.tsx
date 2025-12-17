"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { ShareCard } from "@/components/ShareCard";

type Props = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  summary?: string;
  gift?: string;
  raw?: string;
  hostName?: string;
  treeContainerRef?: React.RefObject<HTMLDivElement>;
  onToast?: (message: string) => void;
};

function useTypewriter(text: string, enabled: boolean, speedMs = 18) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!enabled) return;
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speedMs);
    return () => window.clearInterval(id);
  }, [text, enabled, speedMs]);

  return shown;
}

export function SantaAnalysisModal({
  open,
  onClose,
  loading,
  summary,
  gift,
  raw,
  hostName,
  treeContainerRef,
  onToast,
}: Props) {
  const shareRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [treeSnapshot, setTreeSnapshot] = useState<string>("");
  const finalText = useMemo(() => {
    if (loading) return "산타가 메시지들을 읽고 있어요... 잠시만 기다려줘!";
    if (summary && gift) {
      const name = (hostName ?? "주인공").trim() || "주인공";
      return [
        `${name}님, 올 한 해 정말 수고했어요.`,
        "",
        "친구들이 남긴 마음들을 모아, 산타가 조심스럽게 정리해봤어요.",
        "",
        summary,
        "",
        "그리고 2026년에 당신에게 필요한 진정한 선물은...",
        "",
        `[ ${gift} ]`,
      ].join("\n");
    }
    if (raw) return raw;
    return "아직 분석 결과가 없어요.";
  }, [loading, summary, gift, raw, hostName]);

  const typed = useTypewriter(finalText, open, 14);

  // 트리 컨테이너 스냅샷 촬영
  useEffect(() => {
    if (open && treeContainerRef?.current && summary && gift) {
      // 모달이 열리고 트리 스냅샷이 필요할 때
      const captureTreeSnapshot = async () => {
        try {
          const element = treeContainerRef.current!;
          const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            removeContainer: false,
          });
          const dataUrl = canvas.toDataURL("image/png", 0.95);
          setTreeSnapshot(dataUrl);
        } catch (error) {
          console.error("트리 스냅샷 촬영 실패:", error);
          setTreeSnapshot("");
        }
      };

      // 약간의 딜레이 후 캡처 (렌더링 완료 보장)
      const timer = setTimeout(captureTreeSnapshot, 500);
      return () => clearTimeout(timer);
    } else {
      setTreeSnapshot("");
    }
  }, [open, treeContainerRef, summary, gift]);

  async function downloadShareImage() {
    if (!shareRef.current) return;
    if (!summary || !gift) return;
    const name = (hostName ?? "user").trim() || "user";
    const fileSafe = name.replace(/[^\p{L}\p{N}_-]+/gu, "_");

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: "#FFFDF5",
        scale: 2,
        useCORS: true,
      });
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b: Blob | null) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("이미지 생성에 실패했어요.");

      // 모바일: Web Share API 사용
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `santa-letter-${fileSafe}.png`, {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${name}님의 산타 편지`,
          });
          onToast?.("공유되었어요!");
          setIsDownloading(false);
          return;
        }
      }

      // 데스크톱 또는 Web Share API 미지원: download 속성 사용
      const url = URL.createObjectURL(blob);
      
      // 모바일 Safari 대응: 새 창으로 열기
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const newWindow = window.open(url, "_blank");
        if (newWindow) {
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        }
        onToast?.("이미지를 길게 눌러 저장하세요!");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `santa-letter-${fileSafe}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
        onToast?.("이미지가 저장되었어요! 인스타에 공유해보세요!");
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        // 사용자가 공유를 취소한 경우
        onToast?.("공유가 취소되었어요.");
      } else {
        onToast?.("이미지 저장에 실패했어요. 잠시 후 다시 시도해줘.");
      }
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1400] flex items-center justify-center px-5 py-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="close santa analysis"
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-slate-900/35 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-6 shadow-[0_30px_90px_rgba(25,50,80,0.22)] backdrop-blur-xl ring-1 ring-white/35 sm:p-8 my-auto"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/55 to-transparent opacity-80" />
            <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-white/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold tracking-tight text-slate-800">
                  AI 산타의 한 해 분석
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  친구들의 메시지를 모아 따뜻하게 요약하고, 무형의 선물을
                  처방해요.
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

            {/* Hidden/offscreen Share Card for download (must be rendered, not display:none) */}
            {summary && gift && treeSnapshot ? (
              <div className="fixed left-[-9999px] top-0 opacity-0">
                <ShareCard
                  ref={shareRef}
                  hostName={(hostName ?? "주인공").trim() || "주인공"}
                  treeSnapshot={treeSnapshot}
                  summary={summary}
                  giftKeyword={gift}
                />
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
              <motion.div
                initial={{ rotate: -6, y: 6, scale: 0.98 }}
                animate={{ rotate: 6, y: 0, scale: 1 }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="relative mx-auto h-44 w-44 sm:h-48 sm:w-48"
              >
                <div className="absolute inset-0 rounded-[34px] bg-white/40 shadow-[inset_0_2px_0_rgba(255,255,255,0.65),_0_22px_34px_rgba(25,50,80,0.14)] ring-1 ring-white/45" />
                <Image
                  src="/images/santa.png"
                  alt="Santa"
                  fill
                  sizes="192px"
                  loading="lazy"
                  className="p-4 object-contain drop-shadow-[0_22px_22px_rgba(25,50,80,0.18)]"
                />
              </motion.div>

              <div className="rounded-3xl border border-white/45 bg-white/45 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_26px_rgba(25,50,80,0.10)]">
                <div className="mb-3 text-xs font-extrabold text-slate-600">
                  🎄 산타의 편지
                </div>
                <div className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-800">
                  {typed}
                  <span className="ml-1 inline-block w-2 animate-pulse bg-slate-500/40 align-middle">
                    {" "}
                  </span>
                </div>

                {!loading && gift ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="mt-4 rounded-3xl border border-white/50 bg-white/50 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),_0_16px_26px_rgba(25,50,80,0.10)]"
                  >
                    <div className="text-xs font-extrabold text-slate-600">
                      산타의 선물
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="text-lg font-extrabold text-slate-800">
                        {gift}
                      </div>
                      <motion.div
                        initial={{ rotate: -6, y: 6 }}
                        animate={{ rotate: 6, y: 0 }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }}
                        className="rounded-2xl bg-white/45 px-3 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-white/45"
                      >
                        🎁 짠!
                      </motion.div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <motion.button
                type="button"
                disabled={
                  loading || !summary || !gift || !treeSnapshot || isDownloading
                }
                onClick={() => void downloadShareImage()}
                whileTap={
                  loading || !summary || !gift || !treeSnapshot || isDownloading
                    ? undefined
                    : { scale: 0.98 }
                }
                className={[
                  "rounded-2xl px-4 py-3 text-sm font-extrabold text-white",
                  "bg-gradient-to-b from-christmas-green to-[#239B62]",
                  "shadow-clay shadow-clayInset ring-1 ring-white/35",
                  loading || !summary || !gift || !treeSnapshot || isDownloading
                    ? "opacity-60"
                    : "opacity-100",
                ].join(" ")}
              >
                {isDownloading
                  ? "이미지 만드는 중..."
                  : "이미지로 저장하고 공유하기"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
