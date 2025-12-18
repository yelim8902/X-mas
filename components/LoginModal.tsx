"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
  canClose?: boolean; // 닫기 버튼 활성화 여부 (기본값: true)
};

export function LoginModal({
  open,
  onClose,
  onSuccess,
  message = "나중에 다시 수정하거나 친구들의 메시지를 확인하려면 로그인이 필요해요!",
  canClose = true,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading && canClose) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onClose, canClose]);

  async function handleKakaoLogin() {
    setIsLoading(true);
    try {
      // localStorage에 저장된 트리 ID가 있으면 로그인 후 그 트리 페이지로 리다이렉트
      const myTreeId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("my_tree_id")
          : null;
      const redirectPath = myTreeId ? `/?tree=${myTreeId}` : "/";

      // 프로덕션 URL 사용 (프리뷰 URL이나 localhost 대신)
      const PRODUCTION_URL =
        process.env.NEXT_PUBLIC_PRODUCTION_URL ||
        "https://x-mas-ashy.vercel.app";

      // 현재 URL이 프리뷰 URL이거나 localhost인지 확인
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isPreviewUrl =
        window.location.hostname.includes(".vercel.app") &&
        (window.location.hostname.split(".")[0].length > 20 ||
          window.location.hostname.includes("-git-"));

      // localhost나 프리뷰 URL이면 프로덕션 URL 사용
      const baseUrl =
        isLocalhost || isPreviewUrl ? PRODUCTION_URL : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${baseUrl}/auth/callback?redirect_to=${encodeURIComponent(
            redirectPath
          )}`,
          queryParams: {
            // 카카오 로그인 시 동의 항목을 요청하지 않도록 scope 파라미터 제거
            // Supabase가 기본적으로 추가하는 scope를 제어하기 어려우므로,
            // 카카오 개발자 센터에서 동의 항목을 활성화하거나 비즈 앱 등록이 필요할 수 있음
          },
        },
      });
      if (error) throw error;
      // 성공 시 리다이렉트되므로 setIsLoading은 불필요
    } catch (error) {
      console.error("카카오 로그인 실패:", error);
      alert("로그인에 실패했어요. 다시 시도해주세요.");
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1300] flex items-center justify-center px-5 py-4 overflow-y-auto"
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
            className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[34px] border border-white/45 bg-white/35 p-4 sm:p-6 md:p-8 shadow-[0_30px_90px_rgba(25,50,80,0.22)] backdrop-blur-xl ring-1 ring-white/35 my-auto"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
            <div className="relative">
              {!isLoading && canClose && (
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
              )}

              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-800">
                로그인이 필요해요
              </h2>
              <p className="mb-6 text-sm text-slate-600">{message}</p>

              <div className="space-y-3">
                <motion.button
                  type="button"
                  onClick={handleKakaoLogin}
                  disabled={isLoading}
                  whileHover={!isLoading ? { y: -1 } : undefined}
                  whileTap={!isLoading ? { y: 1, scale: 0.99 } : undefined}
                  className={[
                    "relative w-full select-none rounded-clay px-6 py-4 text-base font-extrabold tracking-tight text-white",
                    "bg-[#FEE500] text-[#000000]",
                    "shadow-clay shadow-clayInset ring-1 ring-white/35 transition-[transform,filter,opacity] duration-150 ease-out",
                    "active:shadow-clayPressed active:translate-y-[1px]",
                    isLoading ? "opacity-60" : "opacity-100",
                  ].join(" ")}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        로그인 중...
                      </>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 0C4.03 0 0 3.42 0 7.64c0 2.66 1.75 5 4.39 6.26-.59 2.18-1.05 3.9-1.08 4.03-.05.23.15.36.35.27.2-.09 2.8-1.65 3.94-2.32 1.1.15 2.26.23 3.4.23 4.97 0 9-3.42 9-7.64C18 3.42 13.97 0 9 0z"
                            fill="#000000"
                          />
                        </svg>
                        카카오로 3초 만에 시작하기
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
