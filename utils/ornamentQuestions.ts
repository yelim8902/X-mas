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
    (name) =>
      `${name}이(가) 없었다면 올해가 이렇게 좋았을까? 어떤 점이 고마웠어?`,
    (name) => `올해 ${name} 덕분에 살아남은 순간이 있다면? (진심)`,
    (name) => `${name}에게 "고마워"라고 말하고 싶은 가장 작은 일 하나는?`,
    (name) =>
      `올 한 해 ${name}이(가) 해준 것 중 가장 사소하지만 고마웠던 일은?`,
    (name) => `${name}에게 감사 인사를 전한다면, 가장 먼저 말하고 싶은 것은?`,
    (name) => `올해 ${name} 덕분에 웃을 수 있었던 순간은?`,
    (name) => `${name}이(가) 내 인생에 선물처럼 다가온 순간은 언제였어?`,
    (name) => `올 한 해 ${name}에게 가장 고마웠던 이유를 한 문장으로?`,
    (name) => `${name}이(가) 없었다면 나는 지금...? (진심으로 고마운 이유)`,
    (name) => `올해 ${name} 덕분에 돈을 아꼈던(또는 썼던) 순간은?`,
    (name) => `${name}에게 가장 고마웠던 이유는? (한 줄 요약)`,
    (name) => `올해 ${name} 덕분에 맛있는 거 먹었던 순간은? (진심 고마워)`,
    (name) => `${name}이(가) 없었다면 나는 아마...? (고마운 이유)`,
  ],
  memory: [
    (name) => `${name}과 함께한 가장 즐거웠던 추억은?`,
    (name) => `올해 ${name}과(와) 함께한 기억에 남는 순간은?`,
    (name) => `${name}과(와) 함께 웃었던 가장 재미있었던 일은?`,
    (name) => `올 한 해 ${name}과(와) 함께한 특별한 날은?`,
    (name) => `${name}과(와) 함께라서 더 좋았던 순간은?`,
    (name) => `올해 ${name}과(와) 보낸 가장 행복했던 시간은?`,
    (name) => `${name}과(와) 함께 있어서 부끄러웠던(웃긴) 순간은?`,
    (name) => `올해 ${name}과(와) 함께한 순간 중 가장 어이없었던 일은?`,
    (name) => `${name}과(와) 함께라서 더 재미있었던 일 하나는?`,
    (name) => `올 한 해 ${name}과(와) 함께한 순간 중 가장 웃긴 실수는?`,
    (name) =>
      `${name}과(와) 함께 보낸 시간 중 "이 순간을 찍어야 했는데" 아쉬웠던 순간은?`,
    (name) => `올해 ${name}과(와) 함께한 순간 중 가장 뻘쭘했던 일은?`,
    (name) => `${name}과(와) 함께라서 더 웃겼던 순간은?`,
    (name) =>
      `올 한 해 ${name}과(와) 함께한 순간 중 가장 기억에 남는 말실수는?`,
    (name) => `${name}과(와) 함께한 순간 중 "이건 비밀"이라고 하고 싶은 일은?`,
    (name) => `올해 ${name}과(와) 함께한 순간 중 가장 웃긴 사진이 찍혔을 때는?`,
    (name) => `${name}과(와) 함께라서 더 재미있었던 실수는?`,
    (name) => `올 한 해 ${name}과(와) 함께한 순간 중 가장 어색했던(웃긴) 일은?`,
    (name) =>
      `${name}과(와) 함께한 순간 중 "이건 절대 잊지 못할 거야"라고 생각한 일은?`,
    (name) =>
      `올해 ${name}과(와) 함께한 순간 중 가장 웃기면서도 부끄러웠던 일은?`,
    (name) =>
      `${name}과(와) 함께한 순간 중 "이건 절대 SNS에 올리면 안 돼"라고 생각한 일은?`,
    (name) => `올해 ${name}과(와) 함께한 순간 중 가장 웃긴 사진이 나왔을 때는?`,
    (name) => `${name}과(와) 함께라서 더 웃겼던 실수나 말실수는?`,
    (name) =>
      `올 한 해 ${name}과(와) 함께한 순간 중 가장 뻘쭘했지만 웃긴 일은?`,
  ],
  compliment: [
    (name) => `올해 ${name}이(가) 가장 빛났던 장면은 언제였어?`,
    (name) => `${name}의 가장 멋있었던 순간은?`,
    (name) => `올 한 해 ${name}의 어떤 점이 가장 인상적이었어?`,
    (name) => `${name}이(가) 자랑스러웠던 순간 하나는?`,
    (name) => `올해 ${name}의 어떤 모습이 가장 예뻤어?`,
    (name) => `${name}이(가) 가장 멋져 보였을 때는 언제였어?`,
    (name) => `${name}의 어떤 점이 가장 부러웠어? (솔직하게!)`,
    (name) => `올해 ${name}이(가) 가장 섹시했던(멋졌던) 순간은?`,
    (name) => `${name}의 어떤 모습이 가장 귀여웠어?`,
    (name) => `올 한 해 ${name}이(가) 가장 카리스마 있었던 순간은?`,
    (name) => `${name}의 어떤 점이 가장 매력적이었어?`,
    (name) => `올해 ${name}이(가) 가장 멋져 보였을 때의 스타일은?`,
    (name) => `${name}의 어떤 말이나 행동이 가장 인상 깊었어?`,
    (name) => `올 한 해 ${name}이(가) 가장 예쁘게(멋지게) 웃었던 순간은?`,
    (name) => `${name}의 어떤 점이 가장 사랑스러웠어?`,
    (name) => `올해 ${name}이(가) 가장 멋져 보였을 때의 옷차림은?`,
    (name) => `${name}의 어떤 말투나 습관이 가장 귀여웠어?`,
    (name) => `올 한 해 ${name}이(가) 가장 섹시했던(멋졌던) 순간의 배경은?`,
    (name) => `${name}의 어떤 모습이 가장 예뻤어? (솔직하게!)`,
    (name) => `올해 ${name}이(가) 가장 멋져 보였을 때의 상황은?`,
    (name) => `${name}의 어떤 점이 가장 부러웠어? (솔직하게 인정하기)`,
    (name) => `올 한 해 ${name}이(가) 가장 멋져 보였을 때의 포즈는?`,
    (name) => `${name}의 어떤 표정이 가장 예뻤어?`,
  ],
  strength: [
    (name) => `${name}이(가) 힘들 때도 해냈던 멋진 점 하나를 말해줘!`,
    (name) => `올해 ${name}의 가장 용감했던 순간은?`,
    (name) => `${name}이(가) 극복해낸 모습이 인상적이었던 때는?`,
    (name) => `올 한 해 ${name}의 어떤 점이 가장 대단했어?`,
    (name) => `${name}이(가) 어려움을 잘 헤쳐나간 순간은?`,
    (name) => `올해 ${name}이(가) 보여준 강인함은 언제였어?`,
    (name) => `${name}이(가) 포기하지 않고 끝까지 해낸 일 하나는?`,
    (name) => `올 한 해 ${name}이(가) 가장 멋지게 극복한 순간은?`,
    (name) => `${name}의 어떤 모습이 가장 대단해 보였어?`,
    (name) => `올해 ${name}이(가) 보여준 인내심이 대단했던 순간은?`,
    (name) => `${name}이(가) 어려운 상황에서도 웃음을 잃지 않았던 때는?`,
    (name) => `올 한 해 ${name}의 어떤 점이 가장 존경스러웠어?`,
    (name) => `${name}이(가) 가장 멋지게 도전했던 순간은?`,
    (name) => `올해 ${name}이(가) 보여준 용기 있는 선택은?`,
    (name) => `${name}이(가) 가장 멋지게 포기하지 않았던 순간은?`,
    (name) => `올 한 해 ${name}이(가) 가장 대단하게 극복한 일은?`,
    (name) => `${name}이(가) 어려움을 웃으며 이겨낸 순간은?`,
    (name) => `올해 ${name}이(가) 가장 멋지게 도전했던 일은?`,
    (name) => `${name}이(가) 가장 멋지게 실패했던 순간은? (도전 자체가 멋져!)`,
    (name) => `올 한 해 ${name}이(가) 가장 대단하게 포기하지 않았던 일은?`,
  ],
  cheerup: [
    (name) => `요즘 ${name}에게 해주고 싶은 다정한 한마디는?`,
    (name) => `${name}이(가) 힘들 때 들려주고 싶은 위로의 말은?`,
    (name) => `지금 ${name}에게 가장 전하고 싶은 말은?`,
    (name) => `${name}을(를) 위해 응원하고 싶은 한마디는?`,
    (name) => `요즘 ${name}을(를) 보며 전하고 싶은 말은?`,
    (name) => `${name}에게 건네고 싶은 따뜻한 메시지는?`,
    (name) => `${name}아(야), 힘들 때 생각해봐. 넌 정말 멋진 사람이야!`,
    (name) => `요즘 ${name}에게 가장 전하고 싶은 위로의 말은?`,
    (name) => `${name}이(가) 지쳤을 때 들려주고 싶은 말은?`,
    (name) => `올 한 해 ${name}에게 가장 해주고 싶은 말은?`,
    (name) => `${name}아(야), 넌 충분히 잘하고 있어!`,
    (name) => `요즘 ${name}에게 가장 필요한 말은 뭘까?`,
    (name) => `${name}이(가) 힘들어 보일 때 가장 전하고 싶은 한마디는?`,
    (name) => `지금 ${name}에게 가장 듣고 싶은 말은?`,
    (name) => `${name}아(야), 힘들어도 괜찮아! 넌 할 수 있어!`,
    (name) => `요즘 ${name}에게 가장 전하고 싶은 따뜻한 말은?`,
    (name) => `${name}이(가) 지쳤을 때 가장 듣고 싶은 위로는?`,
    (name) => `올 한 해 ${name}에게 가장 해주고 싶은 말은? (진심)`,
  ],
  wish: [
    (name) => `내년에 ${name}이(가) 꼭 이뤘으면 하는 바람은?`,
    (name) => `2026년 ${name}에게 가장 바라는 것은?`,
    (name) => `내년에 ${name}이(가) 꼭 경험했으면 하는 일은?`,
    (name) => `${name}에게 내년에 가장 기대하는 것은?`,
    (name) => `2026년 ${name}이(가) 갖게 되길 바라는 것은?`,
    (name) => `내년에 ${name}에게 가장 축복하고 싶은 것은?`,
    (name) => `2026년 ${name}이(가) 꼭 해봤으면 하는 일 하나는?`,
    (name) => `내년에 ${name}에게 가장 바라는 소원은?`,
    (name) => `2026년 ${name}이(가) 가장 행복했으면 하는 순간은?`,
    (name) => `내년에 ${name}이(가) 꼭 만났으면 하는 사람/경험은?`,
    (name) => `2026년 ${name}에게 가장 기대되는 일은?`,
    (name) => `내년에 ${name}이(가) 가장 많이 웃었으면 하는 바람은?`,
    (name) => `2026년 ${name}이(가) 꼭 이뤘으면 하는 작은 소원 하나는?`,
    (name) => `내년에 ${name}에게 가장 축복하고 싶은 것은?`,
    (name) => `2026년 ${name}이(가) 가장 많이 경험했으면 하는 일은?`,
    (name) => `내년에 ${name}이(가) 꼭 해봤으면 하는 웃긴 일은?`,
    (name) => `2026년 ${name}에게 가장 바라는 작은 소원 하나는?`,
    (name) => `내년에 ${name}이(가) 가장 많이 웃었으면 하는 상황은?`,
    (name) => `2026년 ${name}이(가) 꼭 이뤘으면 하는 바람은? (솔직하게!)`,
    (name) => `내년에 ${name}이(가) 꼭 해봤으면 하는 멋진 일은?`,
    (name) => `2026년 ${name}에게 가장 기대되는 작은 행복은?`,
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
