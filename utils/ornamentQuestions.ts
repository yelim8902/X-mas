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

export const ORNAMENT_QUESTION_MAP: Record<
  ItemDesign,
  { category: QuestionCategory; questionTemplate: (name: string) => string }
> = {
  sock: {
    category: "gratitude",
    questionTemplate: (name) => `올 한 해 ${name}에게 가장 고마웠던 순간은?`
  },
  candy_cane: {
    category: "memory",
    questionTemplate: (name) => `${name}과 함께한 가장 즐거웠던 추억은?`
  },
  ball: {
    category: "compliment",
    questionTemplate: (name) => `올해 ${name}이(가) 가장 빛났던 장면은 언제였어?`
  },
  star: {
    category: "strength",
    questionTemplate: (name) =>
      `${name}이(가) 힘들 때도 해냈던 멋진 점 하나를 말해줘!`
  },
  bell: {
    category: "cheerup",
    questionTemplate: (name) => `요즘 ${name}에게 해주고 싶은 다정한 한마디는?`
  },
  snowflake: {
    category: "wish",
    questionTemplate: (name) => `내년에 ${name}이(가) 꼭 이뤘으면 하는 바람은?`
  }
};

export function getOrnamentQuestion(itemDesign: ItemDesign, hostName?: string) {
  const base = ORNAMENT_QUESTION_MAP[itemDesign] ?? ORNAMENT_QUESTION_MAP.sock;
  const name = (hostName ?? "주인공").trim() || "주인공";
  return { category: base.category, question: base.questionTemplate(name) };
}


