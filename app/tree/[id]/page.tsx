"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { MessageModal } from "@/components/MessageModal";
import { UnboxModal } from "@/components/UnboxModal";
import {
  OnboardingModal,
  type HostProfile,
} from "@/components/OnboardingModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { SantaAnalysisModal } from "@/components/SantaAnalysisModal";
import { LoginModal } from "@/components/LoginModal";
import { GlobalNavBar } from "@/components/GlobalNavBar";
import { TreeView } from "@/components/tree/TreeView";
import { OwnerView } from "@/components/tree/OwnerView";
import { GuestView } from "@/components/tree/GuestView";
import {
  supabase,
  type GiftColor,
  type ItemType,
  type MessageRow,
  type TreeRow,
} from "@/utils/supabase";
import { getGuestTreeUrl, getDashboardPath } from "@/utils/url";

export default function TreePage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params?.id as string;

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(
    null
  );
  const [isUnboxOpen, setIsUnboxOpen] = useState(false);
  const [composeDefaults, setComposeDefaults] = useState<{
    itemType: ItemType;
    giftColor?: GiftColor;
  } | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [isSantaOpen, setIsSantaOpen] = useState(false);
  const [isSantaLoading, setIsSantaLoading] = useState(false);
  const [santaSummary, setSantaSummary] = useState<string | undefined>(
    undefined
  );
  const [santaGift, setSantaGift] = useState<string | undefined>(undefined);
  const [santaRaw, setSantaRaw] = useState<string | undefined>(undefined);
  const [savedSanta, setSavedSanta] = useState<{
    summary: string;
    gift: string;
    raw?: string;
    createdAt: number;
    itemCount: number;
  } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [lastGiftId, setLastGiftId] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const santaTimerRef = useRef<number | null>(null);
  const [isSantaVisible, setIsSantaVisible] = useState(false);
  const [santaKey, setSantaKey] = useState(0);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const treeItemsContainerRef = useRef<HTMLDivElement | null>(null);

  const isDebugMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "1";
  }, []);

  const [isGiftUnlocked, setIsGiftUnlocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unlockAt = new Date("2025-12-24T00:00:00+09:00").getTime();
    const isUnlocked = Date.now() >= unlockAt || isDebugMode;
    setIsGiftUnlocked(isUnlocked || isHostMode);
  }, [isDebugMode, isHostMode]);

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
  }, []);

  // 트리 정보 로드
  const loadTreeInfo = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    const tree = data as TreeRow;
    const hostProfile: HostProfile = {
      name: tree.host_name,
      gender: tree.host_gender,
      age: tree.host_age,
      treeStyle: tree.tree_style,
    };
    return hostProfile;
  }, []);

  // 메시지 로드
  const refetchMessages = useCallback(async () => {
    setLoadError(null);
    if (!treeId) return;
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id,tree_id,created_at,sender_name,content,gift_color,item_type,item_design,question_category,position_x,position_y,is_read"
      )
      .eq("tree_id", treeId)
      .order("created_at", { ascending: true });

    if (error) {
      setLoadError(error.message);
      return;
    }
    setMessages((data ?? []) as MessageRow[]);
  }, [treeId]);

  // 트리 소유권 확인
  const checkTreeOwnership = useCallback(
    async (targetTreeId: string, targetUserId: string) => {
      if (!targetUserId || !targetTreeId) {
        setIsOwner(false);
        setIsAuthChecking(false);
        return;
      }

      setIsAuthChecking(true);

      try {
        const { data, error } = await supabase
          .from("trees")
          .select("user_id")
          .eq("id", targetTreeId)
          .single();

        if (error || !data) {
          setIsOwner(false);
          setIsAuthChecking(false);
          return;
        }

        const isOwnerResult = data.user_id === targetUserId;
        setIsOwner(isOwnerResult);
        setIsAuthChecking(false);
      } catch {
        setIsOwner(false);
        setIsAuthChecking(false);
      }
    },
    []
  );

  // 인증 상태 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // host=1 쿼리로 호스트 모드 진입
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsHostMode(params.get("host") === "1");
  }, []);

  // 트리 정보 로드
  useEffect(() => {
    if (!treeId) return;

    void (async () => {
      const treeInfo = await loadTreeInfo(treeId);
      if (treeInfo) {
        setHost(treeInfo);
      } else {
        // 게스트의 경우: 기본값 설정
        setHost({
          name: "크리스마스 트리",
          gender: "other",
          age: 0,
          treeStyle: "tree1.png",
        });
      }
    })();
  }, [treeId, loadTreeInfo]);

  // 소유권 확인
  useEffect(() => {
    if (!treeId) return;

    if (user?.id) {
      void checkTreeOwnership(treeId, user.id);
    } else {
      setIsOwner(false);
      setIsAuthChecking(false);
    }
  }, [treeId, user?.id, checkTreeOwnership]);

  // 메시지 로드
  useEffect(() => {
    void refetchMessages();
  }, [refetchMessages]);

  // 산타 애니메이션
  const triggerSanta = useCallback(() => {
    if (santaTimerRef.current) {
      window.clearTimeout(santaTimerRef.current);
    }
    setIsSantaVisible(true);
    setSantaKey((prev) => prev + 1);
    santaTimerRef.current = window.setTimeout(() => {
      setIsSantaVisible(false);
    }, 3000);
  }, []);

  // 메시지 제출
  const handleSubmitMessage = useCallback(
    async (data: {
      sender_name: string;
      content: string;
      gift_color: GiftColor;
      item_type: ItemType;
      item_design: string;
      question_category?: string | null;
    }) => {
      setIsSubmitting(true);
      try {
        if (!treeId) {
          throw new Error("트리 ID가 없어요. 새로고침 후 다시 시도해줘.");
        }

        const { data: inserted, error } = await supabase
          .from("messages")
          .insert([{ ...data, tree_id: treeId }])
          .select(
            "id,tree_id,created_at,sender_name,content,gift_color,item_type,item_design,question_category"
          )
          .single();

        if (error) throw error;

        if (inserted) {
          const row = inserted as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(row.id))) return prev;
            return [...prev, row];
          });
          setLastGiftId(String(row.id));
          triggerSanta();
        }

        window.setTimeout(() => {
          void refetchMessages();
        }, 600);
      } catch (e) {
        console.error("[메시지 저장] 오류:", e);
        showToast(e instanceof Error ? e.message : "메시지 저장에 실패했어요.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [treeId, triggerSanta, refetchMessages, showToast]
  );

  // 드래그 핸들러
  const handleDragStart = useCallback((id: string) => {
    setDraggingItemId(id);
    setHoveredItemId(id);
  }, []);

  const handleDragEnd = useCallback(
    async (id: string, m: MessageRow, event: any, info: any) => {
      if (!treeItemsContainerRef.current || !treeId) {
        setDraggingItemId(null);
        return;
      }

      const rect = treeItemsContainerRef.current.getBoundingClientRect();
      const containerX = info.point.x - rect.left;
      const containerY = info.point.y - rect.top;

      const xPercent = Math.max(
        0,
        Math.min(100, (containerX / rect.width) * 100)
      );
      const yPercent = Math.max(
        0,
        Math.min(100, (containerY / rect.height) * 100)
      );

      try {
        const { error } = await supabase
          .from("messages")
          .update({ position_x: xPercent, position_y: yPercent })
          .eq("id", m.id);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((msg) =>
            String(msg.id) === id
              ? { ...msg, position_x: xPercent, position_y: yPercent }
              : msg
          )
        );
      } catch (e) {
        console.error("위치 저장 실패:", e);
        showToast("위치 저장에 실패했어요.");
      } finally {
        setDraggingItemId(null);
      }
    },
    [treeId, showToast]
  );

  const handleItemHoverStart = useCallback((id: string) => {
    setHoveredItemId(id);
  }, []);

  const handleItemHoverEnd = useCallback(() => {
    setHoveredItemId(null);
  }, []);

  const handleItemClick = useCallback(
    (message: MessageRow) => {
      const type = (message.item_type ?? "ornament") as ItemType;
      if (type === "gift" && isMounted && !isGiftUnlocked) {
        showToast("크리스마스 이브(12/24)부터 열어볼 수 있어요!");
        return;
      }
      setSelectedMessage(message);
      setIsUnboxOpen(true);
    },
    [isMounted, isGiftUnlocked, showToast]
  );

  // 산타 분석
  const runSantaAnalysis = useCallback(async () => {
    setIsSantaOpen(true);
    setIsSantaLoading(true);
    setSantaSummary(undefined);
    setSantaGift(undefined);
    setSantaRaw(undefined);
    try {
      const res = await fetch("/api/santa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: host?.name ?? null,
          messages: messages.map((m) => ({
            content: m.content,
            question_category: m.question_category ?? null,
          })),
        }),
      });
      const json = (await res.json()) as {
        summary?: string;
        gift_keyword?: string;
        raw?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "AI 분석 실패");
      setSantaSummary(json.summary);
      setSantaGift(json.gift_keyword);
      setSantaRaw(json.raw);

      if (treeId && json.summary && json.gift_keyword) {
        const payload = {
          summary: json.summary,
          gift: json.gift_keyword,
          raw: json.raw,
          createdAt: Date.now(),
          itemCount: messages.length,
        };
        window.localStorage.setItem(
          `xmas.santaResult:${treeId}`,
          JSON.stringify(payload)
        );
        setSavedSanta(payload);
      }
    } catch (e) {
      setSantaRaw(e instanceof Error ? e.message : "AI 분석에 실패했어요.");
    } finally {
      setIsSantaLoading(false);
    }
  }, [host?.name, messages, treeId]);

  // 저장된 산타 결과 로드
  useEffect(() => {
    if (!treeId) {
      setSavedSanta(null);
      return;
    }
    const raw = window.localStorage.getItem(`xmas.santaResult:${treeId}`);
    if (!raw) {
      setSavedSanta(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        summary: string;
        gift: string;
        raw?: string;
        createdAt: number;
        itemCount?: number;
      };
      if (parsed?.summary && parsed?.gift) {
        setSavedSanta({
          summary: parsed.summary,
          gift: parsed.gift,
          raw: parsed.raw,
          createdAt: parsed.createdAt,
          itemCount: Number(parsed.itemCount ?? 0),
        });
      } else setSavedSanta(null);
    } catch {
      setSavedSanta(null);
    }
  }, [treeId]);

  // 트리 이미지 경로
  const treeImageSrc = useMemo(() => {
    if (host?.treeStyle) {
      return `/images/${host.treeStyle}`;
    }
    return messages.length === 0 ? "/images/tree2.png" : "/images/tree1.png";
  }, [host?.treeStyle, messages.length]);

  // 테스트 데이터 초기화
  const resetAllMessages = useCallback(async () => {
    setIsResetting(true);
    try {
      if (!isHostMode) throw new Error("host 모드에서만 초기화할 수 있어요.");
      const secret = process.env.NEXT_PUBLIC_XMAS_ADMIN_SECRET;
      if (!secret) {
        throw new Error(
          "NEXT_PUBLIC_XMAS_ADMIN_SECRET이 없어요. .env.local에 추가해줘."
        );
      }

      const res = await fetch("/api/admin/reset-messages", {
        method: "POST",
        headers: { "x-xmas-admin-secret": secret },
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "초기화 실패");

      setMessages([]);
      setIsUnboxOpen(false);
      setSelectedMessage(null);
      setLastGiftId(null);
      setIsResetOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "초기화에 실패했어요.");
    } finally {
      setIsResetting(false);
    }
  }, [isHostMode]);

  const availableTreeStyles = useMemo(
    () => [
      {
        key: "tree1.png",
        label: "트리 1",
        previewSrc: "/images/tree1.png",
      },
      {
        key: "tree2.png",
        label: "트리 2",
        previewSrc: "/images/tree2.png",
      },
      {
        key: "tree3.png",
        label: "트리 3",
        previewSrc: "/images/tree3.png",
      },
    ],
    []
  );

  if (!treeId) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
        <p className="text-lg font-bold text-slate-700">트리 ID가 없어요.</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <GlobalNavBar
        user={user}
        isOwner={isOwner}
        hostName={host?.name}
        treeId={treeId}
      />

      {/* Soft pastel gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-20 sm:px-8">
        <section className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 sm:mt-6 sm:gap-8">
          {/* Title */}
          <div className="mb-4 flex w-full justify-center">
            <div className="rounded-3xl border border-white/40 bg-white/30 px-5 py-3 text-center shadow-[0_20px_50px_rgba(25,50,80,0.12)] backdrop-blur-xl">
              <p className="text-[15px] font-extrabold tracking-tight text-slate-700 sm:text-base">
                {host?.name ? (
                  <>
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-christmas-red/20 via-christmas-green/20 to-christmas-red/20 blur-md rounded-lg" />
                      <span className="relative inline-block text-lg font-black bg-gradient-to-r from-christmas-red via-[#D97706] to-christmas-green bg-clip-text text-transparent sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        {host.name}
                      </span>
                    </span>
                    <span className="text-slate-600 ml-1">
                      의 크리스마스 트리
                    </span>
                  </>
                ) : (
                  "내 크리스마스 트리"
                )}
              </p>
              {host ? (
                <p className="mt-0.5 text-xs font-semibold text-slate-600">
                  {host.gender === "female"
                    ? "여성"
                    : host.gender === "male"
                    ? "남성"
                    : host.gender === "nonbinary"
                    ? "논바이너리"
                    : "비공개"}{" "}
                  · {host.age}살
                </p>
              ) : null}
            </div>
          </div>

          {/* Tree View */}
          <div className="relative w-[min(82vw,420px)]" ref={treeContainerRef}>
            <TreeView
              messages={messages}
              treeImageSrc={treeImageSrc}
              lastGiftId={lastGiftId}
              draggingItemId={draggingItemId}
              hoveredItemId={hoveredItemId}
              onItemClick={handleItemClick}
              onItemHoverStart={handleItemHoverStart}
              onItemHoverEnd={handleItemHoverEnd}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isGiftUnlocked={isGiftUnlocked}
              isMounted={isMounted}
              treeItemsContainerRef={treeItemsContainerRef}
            />

            {/* 새로고침 버튼 */}
            <motion.button
              type="button"
              onClick={() => {
                void refetchMessages();
                showToast("트리를 새로고침했어요.");
              }}
              disabled={!treeId}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.05 }}
              className={[
                "absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/35 text-slate-700",
                "shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md",
                "transition-[transform,filter] duration-150 ease-out",
                treeId ? "opacity-100" : "opacity-60",
              ].join(" ")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_6px_10px_rgba(25,50,80,0.10)]"
              >
                <path
                  d="M21 12a9 9 0 1 1-2.64-6.36"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 3v6h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>

            {/* Host Mode 디버그 버튼들 */}
            {isHostMode && (
              <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 sm:left-auto sm:right-4 sm:w-auto">
                <motion.button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-white/35 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md"
                >
                  테스트 데이터 초기화
                </motion.button>
              </div>
            )}

            {/* Santa Image */}
            <AnimatePresence>
              {isSantaVisible && (
                <motion.div
                  key={santaKey}
                  className="pointer-events-none absolute z-[999]"
                  style={{ left: "50%", transform: "translate(-50%, 0)" }}
                  initial={{
                    top: -100,
                    opacity: 0,
                    rotate: -8,
                    scale: 0.95,
                  }}
                  animate={{ top: "10%", opacity: 1, rotate: 6, scale: 1 }}
                  exit={{ top: -120, opacity: 0, rotate: 10, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="relative h-40 w-40 sm:h-52 sm:w-52">
                    <Image
                      src="/images/santa.png"
                      alt="Santa"
                      fill
                      sizes="208px"
                      className="object-contain drop-shadow-[0_30px_30px_rgba(25,50,80,0.22)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 소유권 확인 중 로딩 UI */}
          {isAuthChecking ? (
            <div className="flex w-full max-w-md flex-col gap-3 items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-christmas-red border-t-transparent" />
              <div className="text-sm font-semibold text-slate-600">
                트리 정보를 확인하고 있어요...
              </div>
            </div>
          ) : isOwner ? (
            <OwnerView
              messages={messages}
              savedSanta={savedSanta}
              onShare={async () => {
                try {
                  if (!treeId) {
                    showToast("트리 ID가 없어요.");
                    return;
                  }
                  const guestUrl = getGuestTreeUrl(treeId);
                  await navigator.clipboard.writeText(guestUrl);
                  showToast(
                    "링크가 복사되었어요! 카카오톡 등으로 링크 공유해보세요."
                  );
                } catch {
                  showToast("링크 복사에 실패했어요. 주소를 직접 복사해줘.");
                }
              }}
              onUpdate={() => {
                if (messages.length >= 5) void runSantaAnalysis();
              }}
              onViewSanta={() => {
                setIsSantaOpen(true);
                setIsSantaLoading(false);
                setSantaSummary(savedSanta?.summary);
                setSantaGift(savedSanta?.gift);
                setSantaRaw(savedSanta?.raw);
              }}
              onRunSantaAnalysis={() => void runSantaAnalysis()}
              onEditTree={() => setIsOnboardingOpen(true)}
            />
          ) : (
            <GuestView
              hostName={host?.name ?? null}
              onComposeOrnament={() => {
                setComposeDefaults({ itemType: "ornament" });
                setOpen(true);
              }}
              onComposeGift={() => {
                setComposeDefaults({
                  itemType: "gift",
                  giftColor: "red",
                });
                setOpen(true);
              }}
              onCreateTree={() => {
                // localStorage 완전 정리 후 완전 새로고침 (온보딩 모달 자동 열기)
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("my_tree_id");
                  window.localStorage.removeItem("xmas.hostProfile");
                  window.localStorage.removeItem("xmas.pendingTreeData");
                  // create 파라미터와 함께 완전 새로고침하여 온보딩 모달이 바로 뜨게 함
                  window.location.href = "/?create=true";
                }
              }}
            />
          )}

          {/* 메시지 안내 */}
          <p className="max-w-md text-center text-sm text-slate-600 sm:text-base">
            {isOwner ? (
              messages.length === 0 ? (
                <>
                  아직 아무도 꾸미지 않았어요.
                  <br />
                  <span className="font-semibold">링크를 복사해서</span>{" "}
                  친구들에게 공유해봐요!
                </>
              ) : (
                <>아이템을 눌러 메시지를 확인해보세요.</>
              )
            ) : messages.length === 0 ? (
              <>
                첫 번째로 <span className="font-semibold">오너먼트</span>나{" "}
                <span className="font-semibold">선물</span>을 남겨서 트리를
                꾸며줘요!
              </>
            ) : (
              <>아이템을 눌러 메시지를 확인하거나, 새 아이템을 남겨줘요.</>
            )}
          </p>

          {loadError && (
            <p className="max-w-md text-center text-sm font-bold text-christmas-red">
              메시지를 불러오지 못했어요: {loadError}
            </p>
          )}
        </section>

        {/* Modals */}
        <MessageModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmitMessage}
          isSubmitting={isSubmitting}
          defaultItemType={composeDefaults?.itemType}
          defaultGiftColor={composeDefaults?.giftColor}
          hostName={host?.name}
        />

        <UnboxModal
          open={isUnboxOpen}
          locked={
            isMounted &&
            (selectedMessage?.item_type ?? "ornament") === "gift" &&
            !isGiftUnlocked
          }
          message={selectedMessage}
          hostName={host?.name}
          onClose={() => setIsUnboxOpen(false)}
        />

        <OnboardingModal
          open={isOnboardingOpen}
          initial={host ?? undefined}
          availableTreeStyles={availableTreeStyles}
          hasExistingTree={false}
          onViewExistingTree={() => {}}
          onComplete={async (profile) => {
            if (!treeId) return;
            try {
              const { error } = await supabase.from("trees").upsert(
                {
                  id: treeId,
                  host_name: profile.name,
                  host_gender: profile.gender,
                  host_age: profile.age,
                  tree_style: profile.treeStyle,
                  user_id: user?.id ?? null,
                },
                { onConflict: "id" }
              );
              if (error) throw error;
              setHost(profile);
              setIsOnboardingOpen(false);
              showToast("트리 정보가 수정되었어요.");
            } catch (e) {
              console.error("트리 정보 업데이트 실패:", e);
              showToast("트리 정보 수정에 실패했어요.");
            }
          }}
          onClose={() => setIsOnboardingOpen(false)}
        />

        <ConfirmModal
          open={isResetOpen}
          title="테스트 데이터를 초기화할까요?"
          description={`현재 메시지/아이템 ${messages.length}개가 전부 삭제돼요. (되돌릴 수 없음)`}
          confirmText={isResetting ? "삭제 중..." : "전부 삭제"}
          cancelText="취소"
          danger
          onCancel={() => (isResetting ? null : setIsResetOpen(false))}
          onConfirm={() => {
            if (isResetting) return;
            void resetAllMessages();
          }}
        />

        <Toast open={toast.open} message={toast.message} />

        <SantaAnalysisModal
          open={isSantaOpen}
          onClose={() => setIsSantaOpen(false)}
          loading={isSantaLoading}
          summary={santaSummary}
          gift={santaGift}
          raw={santaRaw}
          hostName={host?.name}
          treeContainerRef={treeContainerRef}
          onToast={showToast}
        />

        <LoginModal
          open={isLoginModalOpen}
          canClose={true}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
          }}
          message="트리를 관리하려면 로그인이 필요해요!"
        />
      </div>
    </main>
  );
}
