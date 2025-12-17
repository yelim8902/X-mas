import type { ItemDesign } from "@/utils/supabase";

// 오너먼트 디자인(key) -> 질문 카테고리/문구 매핑
// item_design은 키 기반(sock, candy_cane, ...)으로 저장하는 구조를 사용합니다.

export type QuestionCategory =
  | "gratitude"
  | "memory"
  | "strength"
  | "cheerup"
  | "wish"
  | "compliment";

// 카테고리별 한글 라벨
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  gratitude: "감사",
  memory: "추억",
  strength: "용기",
  cheerup: "위로",
  wish: "바람",
  compliment: "칭찬",
};

// 각 카테고리별 다양한 질문 템플릿
const QUESTION_TEMPLATES: Record<
  QuestionCategory,
  ((name: string) => string)[]
> = {
  gratitude: [
    (name) => `올 한 해 ${name}에게 가장 고마웠던 순간은?`,
    (name) => `올해 ${name}이(가) 내게 해준 것 중 가장 감사했던 일은?`,
    (name) => `${name}에게 고맙다고 전하고 싶은 일 하나는?`,
    (name) => `올 한 해 ${name} 때문에 따뜻해졌던 순간은?`,
    (name) => `${name}에게 가장 고맙다고 느꼈을 때는 언제였어?`,
  ],
  memory: [
    (name) => `${name}과 함께한 가장 즐거웠던 추억은?`,
    (name) => `올해 ${name}과(와) 함께한 기억에 남는 순간은?`,
    (name) => `${name}과(와) 함께 웃었던 가장 재미있었던 일은?`,
    (name) => `올 한 해 ${name}과(와) 함께한 특별한 날은?`,
    (name) => `${name}과(와) 함께라서 더 좋았던 순간은?`,
    (name) => `올해 ${name}과(와) 보낸 가장 행복했던 시간은?`,
  ],
  compliment: [
    (name) => `올해 ${name}이(가) 가장 빛났던 장면은 언제였어?`,
    (name) => `${name}의 가장 멋있었던 순간은?`,
    (name) => `올 한 해 ${name}의 어떤 점이 가장 인상적이었어?`,
    (name) => `${name}이(가) 자랑스러웠던 순간 하나는?`,
    (name) => `올해 ${name}의 어떤 모습이 가장 예뻤어?`,
    (name) => `${name}이(가) 가장 멋져 보였을 때는 언제였어?`,
  ],
  strength: [
    (name) => `${name}이(가) 힘들 때도 해냈던 멋진 점 하나를 말해줘!`,
    (name) => `올해 ${name}의 가장 용감했던 순간은?`,
    (name) => `${name}이(가) 극복해낸 모습이 인상적이었던 때는?`,
    (name) => `올 한 해 ${name}의 어떤 점이 가장 대단했어?`,
    (name) => `${name}이(가) 어려움을 잘 헤쳐나간 순간은?`,
    (name) => `올해 ${name}이(가) 보여준 강인함은 언제였어?`,
  ],
  cheerup: [
    (name) => `요즘 ${name}에게 해주고 싶은 다정한 한마디는?`,
    (name) => `${name}이(가) 힘들 때 들려주고 싶은 위로의 말은?`,
    (name) => `지금 ${name}에게 가장 전하고 싶은 말은?`,
    (name) => `${name}을(를) 위해 응원하고 싶은 한마디는?`,
    (name) => `요즘 ${name}을(를) 보며 전하고 싶은 말은?`,
    (name) => `${name}에게 건네고 싶은 따뜻한 메시지는?`,
  ],
  wish: [
    (name) => `내년에 ${name}이(가) 꼭 이뤘으면 하는 바람은?`,
    (name) => `2026년 ${name}에게 가장 바라는 것은?`,
    (name) => `내년에 ${name}이(가) 꼭 경험했으면 하는 일은?`,
    (name) => `${name}에게 내년에 가장 기대하는 것은?`,
    (name) => `2026년 ${name}이(가) 갖게 되길 바라는 것은?`,
    (name) => `내년에 ${name}에게 가장 축복하고 싶은 것은?`,
  ],
};

export const ORNAMENT_QUESTION_MAP: Record<
  ItemDesign,
  { category: QuestionCategory }
> = {
  sock: {
    category: "gratitude",
  },
  candy_cane: {
    category: "memory",
  },
  ball: {
    category: "compliment",
  },
  star: {
    category: "strength",
  },
  bell: {
    category: "cheerup",
  },
  snowflake: {
    category: "wish",
  },
};

// itemDesign을 기반으로 안정적인 랜덤 질문 선택 (항상 같은 결과)
function stableRand(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getOrnamentQuestion(
  itemDesign: ItemDesign,
  hostName?: string,
  messageId?: string
) {
  const base = ORNAMENT_QUESTION_MAP[itemDesign] ?? ORNAMENT_QUESTION_MAP.sock;
  const name = (hostName ?? "주인공").trim() || "주인공";
  const templates = QUESTION_TEMPLATES[base.category];

  // messageId가 있으면 안정적으로 선택, 없으면 랜덤
  let selectedIndex = 0;
  if (messageId) {
    const rand = stableRand(hashSeed(messageId));
    selectedIndex = Math.floor(rand() * templates.length);
  } else {
    selectedIndex = Math.floor(Math.random() * templates.length);
  }

  const question = templates[selectedIndex](name);
  return { category: base.category, question };
}
