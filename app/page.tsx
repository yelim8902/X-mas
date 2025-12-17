"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageModal } from "@/components/MessageModal";
import { UnboxModal } from "@/components/UnboxModal";
import {
  OnboardingModal,
  type HostProfile,
} from "@/components/OnboardingModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { SantaAnalysisModal } from "@/components/SantaAnalysisModal";
import {
  supabase,
  type GiftColor,
  type ItemType,
  type MessageRow,
  type TreeRow,
} from "@/utils/supabase";
import { resolveItemFileBase } from "@/utils/itemAssets";

// 순수 함수들을 컴포넌트 외부로 이동 (최적화)
function stableRand(seed: number) {
  // mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string) {
  // FNV-1a 32bit
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const santaTimerRef = useRef<number | null>(null);
  const [isSantaVisible, setIsSantaVisible] = useState(false);
  const [santaKey, setSantaKey] = useState(0);
  const [lastGiftId, setLastGiftId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(
    null
  );
  const [isUnboxOpen, setIsUnboxOpen] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
  const treeContainerRef = useRef<HTMLDivElement | null>(null); // 전체 트리 영역 (트리 이미지 + 오너먼트/선물)
  const treeItemsContainerRef = useRef<HTMLDivElement | null>(null); // 오너먼트/선물만 (드래그 제약용)

  const isDebugMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "1";
  }, []);

  const isUnlocked = useMemo(() => {
    // Time Lock: 12/24 00:00 (KST)
    const unlockAt = new Date("2025-12-24T00:00:00+09:00").getTime();
    return Date.now() >= unlockAt || isDebugMode;
  }, [isDebugMode]);

  const isGiftUnlocked = useMemo(() => {
    // 선물(gift)만 타임락 적용. host=1 이면 선물도 언제든지 열람 가능.
    return isUnlocked || isHostMode;
  }, [isUnlocked, isHostMode]);

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
  }, []);

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

      // ✅ 분석 결과 저장(다시 보기)
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

  const isAfterDDay = useMemo(() => {
    // D-Day: 12/25 00:00 (KST)
    const dday = new Date("2025-12-25T00:00:00+09:00").getTime();
    return Date.now() >= dday;
  }, []);

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

  useEffect(() => {
    return () => {
      if (santaTimerRef.current) window.clearTimeout(santaTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // host=1 쿼리로 호스트 모드 진입 (D-Day 전에도 열어볼 수 있음)
    const params = new URLSearchParams(window.location.search);
    setIsHostMode(params.get("host") === "1");
  }, []);

  useEffect(() => {
    // ✅ 오너/게스트 구분 로직: URL의 owner 토큰과 localStorage의 owner_token 비교
    const params = new URLSearchParams(window.location.search);
    const urlTree = params.get("tree");
    const urlOwnerToken = params.get("owner");
    const storedOwnerToken = window.localStorage.getItem("owner_token");
    const myTree = window.localStorage.getItem("my_tree_id");

    if (urlTree) {
      // URL에 tree 파라미터가 있는 경우
      setTreeId(urlTree);

      // 오너 판단: URL에 owner 토큰이 있고, localStorage의 owner_token과 일치하며, tree_id도 일치하는 경우
      const isOwnerTokenValid = Boolean(
        urlOwnerToken &&
          storedOwnerToken &&
          urlOwnerToken === storedOwnerToken &&
          myTree === urlTree
      );
      setIsOwner(isOwnerTokenValid);
      return;
    }

    if (myTree && storedOwnerToken) {
      // 주인: URL에 tree 파라미터가 없지만 localStorage에 my_tree_id와 owner_token이 있으면 오너용 링크로 자동 진입
      params.set("tree", myTree);
      params.set("owner", storedOwnerToken);
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", next);
      setTreeId(myTree);
      setIsOwner(true);
      return;
    }

    // 아직 트리 생성 전(최초 방문) - 온보딩 완료 시 생성됨
    setTreeId(null);
    setIsOwner(false);
  }, []);

  // 트리 정보를 Supabase에서 로드하는 함수
  const loadTreeInfo = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      // 트리 정보가 없으면 null로 설정 (기본 트리 표시)
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

  // treeId가 변경될 때마다 트리 정보 로드
  useEffect(() => {
    if (!treeId) {
      // treeId가 없으면 localStorage에서 로드 (오너의 경우, 최초 방문 전)
      const raw = window.localStorage.getItem("xmas.hostProfile");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as HostProfile;
          if (parsed?.name) {
            const migrateMap: Record<string, string> = {
              "tree.png": "tree1.png",
              "tree2.png": "tree2.png",
              "tree_basic.png": "tree3.png",
            };
            const nextTreeStyle =
              migrateMap[parsed.treeStyle] ?? parsed.treeStyle;
            const next = { ...parsed, treeStyle: nextTreeStyle };
            setHost(next);
            if (nextTreeStyle !== parsed.treeStyle) {
              window.localStorage.setItem(
                "xmas.hostProfile",
                JSON.stringify(next)
              );
            }
          }
        } catch {
          // 파싱 실패 시 무시
        }
      }
      return;
    }

    // treeId가 있으면 Supabase에서 트리 정보 로드 (오너/게스트 모두)
    void (async () => {
      const treeInfo = await loadTreeInfo(treeId);
      if (treeInfo) {
        // Supabase에서 트리 정보를 성공적으로 로드한 경우
        setHost(treeInfo);
      } else {
        // 트리 정보가 Supabase에 없으면 localStorage에서 로드 (오너의 경우에만)
        if (isOwner) {
          const raw = window.localStorage.getItem("xmas.hostProfile");
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as HostProfile;
              if (parsed?.name) {
                const migrateMap: Record<string, string> = {
                  "tree.png": "tree1.png",
                  "tree2.png": "tree2.png",
                  "tree_basic.png": "tree3.png",
                };
                const nextTreeStyle =
                  migrateMap[parsed.treeStyle] ?? parsed.treeStyle;
                const next = { ...parsed, treeStyle: nextTreeStyle };
                setHost(next);
              }
            } catch {
              // 파싱 실패 시 무시
            }
          }
        }
        // 게스트의 경우: Supabase에 트리 정보가 없으면 host를 null로 두고 계속 진행
        // (트리가 존재하지 않는 경우이거나, 아직 생성되지 않은 경우)
      }
    })();
  }, [treeId, isOwner, loadTreeInfo]);

  // 첫 방문: host profile 없으면 온보딩
  useEffect(() => {
    // 게스트는 온보딩 스킵 (URL에 ?tree=... 파라미터가 있고 내 트리가 아닌 경우)
    if (treeId && !isOwner) return;

    // treeId가 null이고 localStorage에 my_tree_id도 없으면 → 첫 방문자 → 온보딩 열기
    const myTreeId = window.localStorage.getItem("my_tree_id");
    if (!treeId && !myTreeId) {
      const raw = window.localStorage.getItem("xmas.hostProfile");
      if (!raw) {
        setIsOnboardingOpen(true);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as HostProfile;
        if (!parsed?.name) {
          setIsOnboardingOpen(true);
        }
      } catch {
        setIsOnboardingOpen(true);
      }
      return;
    }

    // 기존 로직: 오너인 경우 hostProfile 확인
    if (isOwner) {
      const raw = window.localStorage.getItem("xmas.hostProfile");
      if (!raw) {
        setIsOnboardingOpen(true);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as HostProfile;
        if (!parsed?.name) {
          setIsOnboardingOpen(true);
        }
      } catch {
        setIsOnboardingOpen(true);
      }
    }
  }, [treeId, isOwner]);

  useEffect(() => {
    void refetchMessages();
  }, [refetchMessages]);

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

  useEffect(() => {
    if (!treeId) return;
    const channel = supabase
      // 채널은 tree별로 분리(다른 tree 구독과 충돌 방지)
      .channel(`messages-inserts:${treeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as MessageRow;
          // 일부 환경에서 filter가 기대대로 동작하지 않을 수 있어 클라이언트에서도 한 번 더 필터링
          if (String(row.tree_id ?? "") !== String(treeId)) return;
          setMessages((prev) => {
            if (prev.some((m) => String(m.id) === String(row.id))) return prev;
            return [...prev, row];
          });
          setLastGiftId(String(row.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [treeId]);

  const triggerSanta = useCallback(() => {
    if (santaTimerRef.current) window.clearTimeout(santaTimerRef.current);
    setSantaKey((k) => k + 1);
    setIsSantaVisible(true);
    santaTimerRef.current = window.setTimeout(() => {
      setIsSantaVisible(false);
    }, 3000);
  }, []);

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
        if (!treeId)
          throw new Error("트리 ID가 없어요. 새로고침 후 다시 시도해줘.");
        // insert 후 바로 화면에 쌓이도록, inserted row를 받아 낙관적 업데이트
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
          // DB 저장 성공 시점에 산타 애니메이션 실행
          setLastGiftId(String(row.id));
          triggerSanta();
        } else {
          // 혹시 returning이 막혀있으면 fallback으로 재조회
          void refetchMessages();
          setLastGiftId(null);
          triggerSanta();
        }
        // Realtime이 꺼져있거나 지연되는 경우를 대비해, 백그라운드에서 한 번 더 동기화
        window.setTimeout(() => {
          void refetchMessages();
        }, 600);
      } finally {
        setIsSubmitting(false);
      }
    },
    [treeId, triggerSanta, refetchMessages]
  );

  const resetAllMessages = useCallback(async () => {
    setIsResetting(true);
    try {
      // ✅ host 모드에서만: 서버 API로만 삭제(클라이언트에서 직접 DELETE 금지)
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

  // 트리 스타일 옵션 메모이제이션
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

  // 트리 이미지 경로 계산 메모이제이션
  const treeImageSrc = useMemo(() => {
    if (host?.treeStyle) {
      return `/images/${host.treeStyle}`;
    }
    return messages.length === 0 ? "/images/tree2.png" : "/images/tree1.png";
  }, [host?.treeStyle, messages.length]);

  const itemPlacements = useMemo(() => {
    // 🚨 중요: id 기반 난수로 "한 번 정해진 위치는 절대 변하지 않게" 고정
    // item_type별 배치 범위 분리:
    // - ornament: 트리 중상단 "가지" 영역에 더 자연스럽게 (너무 끝/너무 꼭대기 방지)
    // - gift: 트리 밑동 근처에 더 큼직하게
    const out: Record<
      string,
      {
        leftPct: number;
        topPct?: number;
        bottomPct?: number;
        size: number;
        rotate: number;
        z: number;
      }
    > = {};

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const id = String(m.id);
      const rand = stableRand(hashSeed(id));
      const type = (m.item_type ?? "ornament") as ItemType;

      if (type === "gift") {
        // 선물: 밑동에 더 모이게 + 확실히 더 크게
        // 가운데에 좀 더 몰리게(간단한 ease-in/out)
        const u = rand();
        const centerBias = 0.5 + (u - 0.5) * 0.75; // 0.125~0.875 근처
        const leftPct = 18 + centerBias * 64; // 18~82
        const bottomPct = -2 + rand() * 12; // -2~10
        const rotate = -14 + rand() * 28; // 살짝만 비틀기
        const size = Math.round(52 + rand() * 28); // 52~80 (더 큼직하게)
        out[id] = { leftPct, bottomPct, size, rotate, z: 20 };
      } else {
        // 오너먼트: 트리 실루엣(콘/삼각형)을 따라 배치
        // - top이 높을수록(left 범위 좁음), 아래로 갈수록 넓어짐
        const topMin = 20;
        const topMax = 70;
        const t = rand(); // 0..1
        const topPct = topMin + t * (topMax - topMin); // 20~70

        // topPct를 0..1로 정규화 (0=꼭대기, 1=아래쪽)
        const yNorm = (topPct - topMin) / (topMax - topMin);

        // 좌우 반폭: 위(0)에서는 좁게, 아래(1)에서는 넓게
        // center=50, halfWidth: 12% ~ 34%
        const halfMin = 12;
        const halfMax = 34;
        const half = halfMin + yNorm * (halfMax - halfMin);

        const center = 50;
        const leftMin = Math.max(10, center - half);
        const leftMax = Math.min(90, center + half);
        const leftPct = leftMin + rand() * (leftMax - leftMin);

        const rotate = -18 + rand() * 36;
        const size = Math.round(32 + rand() * 16); // 32~48 (더 크게)
        out[id] = { leftPct, topPct, size, rotate, z: 20 };
      }
    }
    return out;
  }, [messages]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Soft pastel gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-skyPastel-50 via-skyPastel-100 to-skyPastel-200" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
        <section className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 sm:mt-6 sm:gap-8">
          {/* Tree image */}
          <div className="relative w-[min(82vw,420px)]">
            {/* Title (merged closer to tree) */}
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

            {/* Profile edit shortcut */}
            {isOwner ? (
              <div className="mb-3 flex w-full justify-center">
                <motion.button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl bg-white/35 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md"
                >
                  내 트리 정보 수정
                </motion.button>
              </div>
            ) : null}

            {/* Main Container (relative): Tree + Gifts(absolute) + Santa(absolute) */}
            <div
              className="relative overflow-hidden rounded-[44px] border border-white/40 bg-white/30 p-4 shadow-[0_30px_70px_rgba(25,50,80,0.16)] backdrop-blur-lg sm:p-6"
              ref={treeContainerRef}
            >
              {/* 새로고침 버튼 - 트리 카드 우측 상단 */}
              <motion.button
                type="button"
                onClick={() => {
                  void refetchMessages();
                  showToast("트리를 새로고침했어요.");
                }}
                disabled={!treeId}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.05 }}
                aria-label="트리 새로고침"
                title="트리 새로고침"
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
              {isHostMode ? (
                <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 sm:left-auto sm:right-4 sm:w-auto">
                  <motion.button
                    type="button"
                    onClick={() => setIsResetOpen(true)}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-white/35 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md"
                  >
                    테스트 데이터 초기화
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => {
                      // ✅ 새 트리 만들기: tree_id와 owner_token 새로 발급 → localStorage/URL 반영 → 상태 초기화
                      const params = new URLSearchParams(
                        window.location.search
                      );
                      const nextTree =
                        typeof crypto !== "undefined" &&
                        "randomUUID" in crypto
                          ? crypto.randomUUID()
                          : String(Date.now());
                      const nextOwnerToken =
                        typeof crypto !== "undefined" &&
                        "randomUUID" in crypto
                          ? crypto.randomUUID()
                          : String(Date.now() + Math.random());
                      window.localStorage.setItem("my_tree_id", nextTree);
                      window.localStorage.setItem(
                        "owner_token",
                        nextOwnerToken
                      );
                      params.set("tree", nextTree);
                      params.set("owner", nextOwnerToken);
                      const nextUrl = `${
                        window.location.pathname
                      }?${params.toString()}`;
                      window.history.replaceState({}, "", nextUrl);

                      setTreeId(nextTree);
                      setIsOwner(true);
                      setMessages([]);
                      setSelectedMessage(null);
                      setIsUnboxOpen(false);
                      setLastGiftId(null);
                      showToast("새 트리를 만들었어요! 링크를 공유해봐요.");
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-white/35 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_10px_18px_rgba(25,50,80,0.10)] ring-1 ring-white/45 backdrop-blur-md"
                  >
                    새 트리 만들기
                  </motion.button>
                </div>
              ) : null}
              <div className="relative aspect-[1/1.05] w-full">
                <Image
                  src={treeImageSrc}
                  alt="3D Christmas tree"
                  fill
                  priority
                  sizes="(max-width: 640px) 82vw, 420px"
                  className="object-contain"
                />
              </div>

              {/* Items (inside tree container) */}
              <div
                className="absolute inset-0"
                id="tree-container"
                ref={treeItemsContainerRef}
              >
                {messages.map((m) => {
                  const id = String(m.id);
                  const p = itemPlacements[id];
                  const type = (m.item_type ?? "ornament") as ItemType;
                  const fileBase = resolveItemFileBase({
                    itemType: type,
                    itemDesign: m.item_design,
                    giftColor: m.gift_color,
                  });
                  const src = `/images/${fileBase}.png`;
                  const isNew =
                    lastGiftId && String(m.id) === String(lastGiftId);
                  const baseRot = p?.rotate ?? 0;
                  const isDragging = draggingItemId === id;

                  // 위치 계산 (드래그 중에는 Framer Motion이 transform으로 처리)
                  const leftPct = p?.leftPct ?? 50;
                  const topPct = type === "ornament" ? p?.topPct : undefined;
                  const bottomPct = type === "gift" ? p?.bottomPct : undefined;

                  return (
                    <motion.button
                      key={String(m.id)}
                      type="button"
                      initial={{ opacity: 0, scale: 0.5, rotate: baseRot - 12 }}
                      animate={{
                        opacity: 1,
                        scale: isDragging ? 1.1 : 1,
                        rotate: isDragging
                          ? baseRot
                          : [
                              baseRot - 12,
                              baseRot + 12,
                              baseRot - 7,
                              baseRot + 7,
                              baseRot,
                            ],
                      }}
                      transition={{
                        rotate: {
                          duration: isDragging ? 0 : 0.9,
                          ease: "easeOut",
                          delay: isNew && !isDragging ? 0.15 : 0,
                        },
                        opacity: {
                          duration: 0.25,
                          ease: "easeOut",
                          delay: isNew && !isDragging ? 0.15 : 0,
                        },
                        scale: { type: "spring", stiffness: 520, damping: 22 },
                        filter: { duration: 0.12 },
                      }}
                      drag
                      dragMomentum={false}
                      dragConstraints={treeItemsContainerRef}
                      dragElastic={0}
                      onDragStart={() => {
                        setDraggingItemId(id);
                        setHoveredItemId(id);
                      }}
                      onDragEnd={async (event, info) => {
                        if (!treeItemsContainerRef.current || !treeId) {
                          setDraggingItemId(null);
                          return;
                        }

                        // 드래그 후 최종 위치를 계산 (아이템의 중심점 기준)
                        const rect =
                          treeItemsContainerRef.current.getBoundingClientRect();
                        const itemElement = event.target as HTMLElement;

                        // 다음 프레임에서 계산 (드래그 애니메이션이 완료된 후)
                        requestAnimationFrame(() => {
                          const itemRect = itemElement.getBoundingClientRect();

                          // 아이템의 중심점 계산
                          const itemCenterX =
                            itemRect.left + itemRect.width / 2;
                          const itemCenterY =
                            itemRect.top + itemRect.height / 2;

                          // 컨테이너 기준 상대 위치
                          const relativeX = itemCenterX - rect.left;
                          const relativeY = itemCenterY - rect.top;

                          // 퍼센트로 변환 (0~100% 범위로 제한)
                          const xPercent = Math.max(
                            0,
                            Math.min(100, (relativeX / rect.width) * 100)
                          );
                          const yPercent = Math.max(
                            0,
                            Math.min(100, (relativeY / rect.height) * 100)
                          );

                          // DB에 위치 저장
                          void (async () => {
                            try {
                              const { error } = await supabase
                                .from("messages")
                                .update({
                                  position_x: xPercent,
                                  position_y: yPercent,
                                })
                                .eq("id", m.id);

                              if (error) throw error;

                              // 메시지 목록 업데이트
                              setMessages((prev) =>
                                prev.map((msg) =>
                                  String(msg.id) === id
                                    ? {
                                        ...msg,
                                        position_x: xPercent,
                                        position_y: yPercent,
                                      }
                                    : msg
                                )
                              );
                            } catch (e) {
                              console.error("위치 저장 실패:", e);
                              showToast("위치 저장에 실패했어요.");
                            } finally {
                              setDraggingItemId(null);
                            }
                          })();
                        });
                      }}
                      className="absolute cursor-grab active:cursor-grabbing select-none"
                      style={{
                        left: `${leftPct}%`,
                        top:
                          type === "ornament" && topPct !== undefined
                            ? `${topPct}%`
                            : undefined,
                        bottom:
                          type === "gift" && bottomPct !== undefined
                            ? `${bottomPct}%`
                            : undefined,
                        width: p?.size ?? (type === "gift" ? 34 : 24),
                        height: p?.size ?? (type === "gift" ? 34 : 24),
                        transform:
                          type === "gift"
                            ? "translate(-50%, 0)"
                            : "translate(-50%, -50%)",
                        zIndex: isDragging || hoveredItemId === id ? 999 : 20,
                      }}
                      title={`${m.sender_name}: ${m.content}`}
                      onClick={(e) => {
                        // 드래그 중이면 클릭 이벤트 무시
                        if (isDragging) {
                          e.stopPropagation();
                          return;
                        }
                        // ✅ 오너먼트는 언제든 열람 가능, 선물만 타임락
                        if (type === "gift" && !isGiftUnlocked) {
                          showToast(
                            "크리스마스 이브(12/24)부터 열어볼 수 있어요!"
                          );
                          return;
                        }
                        setSelectedMessage(m);
                        setIsUnboxOpen(true);
                      }}
                      onHoverStart={() => {
                        if (!isDragging) setHoveredItemId(id);
                      }}
                      onHoverEnd={() => {
                        if (!isDragging) {
                          setHoveredItemId((prev) =>
                            prev === id ? null : prev
                          );
                        }
                      }}
                      whileHover={
                        !isDragging
                          ? {
                              scale: 1.2,
                              filter: "brightness(1.1)",
                            }
                          : undefined
                      }
                      whileTap={!isDragging ? { scale: 0.98 } : undefined}
                    >
                      <Image
                        src={src}
                        alt={type === "gift" ? "gift" : "ornament"}
                        fill
                        sizes="32px"
                        loading="lazy"
                        className="object-contain drop-shadow-[2px_4px_6px_rgba(0,0,0,0.25)] pointer-events-none"
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Santa Image (absolute): top -100px -> top 10%, left 50% */}
              <AnimatePresence>
                {isSantaVisible ? (
                  <motion.div
                    key={santaKey}
                    className="pointer-events-none absolute z-[999]"
                    style={{ left: "50%", transform: "translate(-50%, 0)" }}
                    initial={{ top: -100, opacity: 0, rotate: -8, scale: 0.95 }}
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
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Buttons: Owner vs Guest */}
          {isOwner ? (
            <div className="flex w-full max-w-md flex-col gap-3">
              <motion.button
                type="button"
                onClick={async () => {
                  try {
                    // 게스트용 링크만 복사 (owner 토큰 제외)
                    const params = new URLSearchParams(window.location.search);
                    params.delete("owner"); // owner 토큰 제거
                    const guestUrl = `${window.location.origin}${
                      window.location.pathname
                    }?${params.toString()}`;
                    await navigator.clipboard.writeText(guestUrl);
                    showToast("링크가 복사되었어요! 친구들에게 공유하세요.");
                  } catch {
                    showToast("링크 복사에 실패했어요. 주소를 직접 복사해줘.");
                  }
                }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1, scale: 0.99 }}
                className={[
                  "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-slate-800",
                  "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
                  "transition-[transform,box-shadow] duration-150 ease-out",
                ].join(" ")}
              >
                <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
                <span className="relative">내 트리 링크 복사하기</span>
              </motion.button>

              {/* 3단계 버튼 상태: 초기 / 완료 / 업데이트 */}
              {savedSanta ? (
                // 완료 상태 또는 업데이트 상태
                messages.length !== savedSanta.itemCount ? (
                  // 업데이트 상태: 새 메시지 있음
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (messages.length >= 5) void runSantaAnalysis();
                    }}
                    disabled={messages.length < 5}
                    whileHover={messages.length >= 5 ? { y: -1 } : undefined}
                    whileTap={
                      messages.length >= 5 ? { y: 1, scale: 0.99 } : undefined
                    }
                    className={[
                      "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
                      "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
                      messages.length >= 5 ? "opacity-100" : "opacity-60",
                    ].join(" ")}
                  >
                    산타 편지 업데이트{" "}
                    <span className="ml-1 inline-block rounded-full bg-christmas-red px-2 py-0.5 text-xs font-bold text-white">
                      New!
                    </span>
                  </motion.button>
                ) : (
                  // 완료 상태: 새 메시지 없음
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsSantaOpen(true);
                      setIsSantaLoading(false);
                      setSantaSummary(savedSanta.summary);
                      setSantaGift(savedSanta.gift);
                      setSantaRaw(savedSanta.raw);
                    }}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 1, scale: 0.99 }}
                    className={[
                      "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
                      "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
                    ].join(" ")}
                  >
                    산타 편지 다시 보기
                  </motion.button>
                )
              ) : (
                // 초기 상태: 분석 안 함
                <motion.button
                  type="button"
                  disabled={messages.length < 5}
                  onClick={() => void runSantaAnalysis()}
                  whileHover={messages.length >= 5 ? { y: -1 } : undefined}
                  whileTap={
                    messages.length >= 5 ? { y: 1, scale: 0.99 } : undefined
                  }
                  className={[
                    "relative w-full max-w-md select-none rounded-3xl px-6 py-3 text-base font-extrabold tracking-tight text-slate-800",
                    "border border-white/45 bg-white/35 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),_0_18px_30px_rgba(25,50,80,0.14)] backdrop-blur-xl ring-1 ring-white/35",
                    messages.length >= 5 ? "opacity-100" : "opacity-60",
                  ].join(" ")}
                >
                  산타에게 선물 받기
                  <span className="ml-2 text-xs font-bold text-slate-600">
                    ({messages.length}/5)
                  </span>
                </motion.button>
              )}
            </div>
          ) : (
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:gap-4">
              <motion.button
                type="button"
                onClick={() => {
                  setComposeDefaults({ itemType: "ornament" });
                  setOpen(true);
                }}
                disabled={!host || isOnboardingOpen}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1, scale: 0.99 }}
                className={[
                  "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-white",
                  "bg-gradient-to-b from-christmas-green to-[#239B62]",
                  "shadow-clay shadow-clayInset ring-1 ring-white/35",
                  "transition-[transform,box-shadow] duration-150 ease-out",
                  "active:shadow-clayPressed active:translate-y-[1px]",
                  !host || isOnboardingOpen ? "opacity-60" : "opacity-100",
                ].join(" ")}
              >
                <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
                <span className="relative">오너먼트 달기</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => {
                  setComposeDefaults({ itemType: "gift", giftColor: "red" });
                  setOpen(true);
                }}
                disabled={!host || isOnboardingOpen}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1, scale: 0.99 }}
                className={[
                  "group relative w-full select-none rounded-clay px-6 py-4 text-lg font-extrabold tracking-tight text-white",
                  "bg-gradient-to-b from-christmas-red to-[#D73C3C]",
                  "shadow-clay shadow-clayInset ring-1 ring-white/35",
                  "transition-[transform,box-shadow] duration-150 ease-out",
                  "active:shadow-clayPressed active:translate-y-[1px]",
                  !host || isOnboardingOpen ? "opacity-60" : "opacity-100",
                ].join(" ")}
              >
                <span className="pointer-events-none absolute inset-0 rounded-clay bg-gradient-to-b from-white/25 to-transparent opacity-70" />
                <span className="relative">선물 주기</span>
                <span className="pointer-events-none absolute -right-2 -top-2 h-10 w-10 rounded-full bg-white/25 blur-xl" />
              </motion.button>
            </div>
          )}

          <p className="max-w-md text-center text-sm text-slate-600 sm:text-base">
            {isOwner ? (
              messages.length === 0 ? (
                <>
                  아직 아무도 꾸미지 않았어요.{" "}
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

          {loadError ? (
            <p className="max-w-md text-center text-sm font-bold text-christmas-red">
              메시지를 불러오지 못했어요: {loadError}
            </p>
          ) : null}

          {/* Owner일 때는 위에 버튼 영역에서만 AI/Share 노출 */}
        </section>
      </div>

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
        onComplete={async (profile) => {
          setHost(profile);
          window.localStorage.setItem(
            "xmas.hostProfile",
            JSON.stringify(profile)
          );
          // ✅ 트리 생성(Create): tree_id와 owner_token 생성 후 localStorage 저장 + URL에 반영
          const params = new URLSearchParams(window.location.search);
          let myTree = window.localStorage.getItem("my_tree_id");
          if (!myTree) {
            myTree =
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : String(Date.now());
            window.localStorage.setItem("my_tree_id", myTree);
          }

          // 오너 토큰 생성 (오너 전용 링크용)
          let ownerToken = window.localStorage.getItem("owner_token");
          if (!ownerToken) {
            ownerToken =
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : String(Date.now() + Math.random());
            window.localStorage.setItem("owner_token", ownerToken);
          }

          // 오너용 링크로 설정 (tree + owner 토큰)
          params.set("tree", myTree);
          params.set("owner", ownerToken);
          const next = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState({}, "", next);
          setTreeId(myTree);
          setIsOwner(true);

          // ✅ 트리 정보를 Supabase에 저장/업데이트
          try {
            const { error } = await supabase.from("trees").upsert(
              {
                id: myTree,
                host_name: profile.name,
                host_gender: profile.gender,
                host_age: profile.age,
                tree_style: profile.treeStyle,
              },
              { onConflict: "id" }
            );
            if (error) {
              console.error("트리 정보 저장 실패:", error);
            }
          } catch (e) {
            console.error("트리 정보 저장 중 오류:", e);
          }

          setIsOnboardingOpen(false);
        }}
        onClose={
          host
            ? async () => {
                setIsOnboardingOpen(false);
                // 트리 정보 수정 후 Supabase에 업데이트
                if (treeId && host) {
                  try {
                    const { error } = await supabase.from("trees").upsert(
                      {
                        id: treeId,
                        host_name: host.name,
                        host_gender: host.gender,
                        host_age: host.age,
                        tree_style: host.treeStyle,
                      },
                      { onConflict: "id" }
                    );
                    if (error) {
                      console.error("트리 정보 업데이트 실패:", error);
                    }
                  } catch (e) {
                    console.error("트리 정보 업데이트 중 오류:", e);
                  }
                }
              }
            : undefined
        }
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
    </main>
  );
}
