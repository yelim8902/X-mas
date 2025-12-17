import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ReqBody = {
  hostName?: string | null;
  messages: { content: string; question_category?: string | null }[];
};

async function listAvailableModels(apiKey: string) {
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
  ];
  const out: Record<string, unknown> = {};
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        // 캐시/ISR 방지(서버 라우트에서 진단용)
        cache: "no-store",
      });
      const text = await res.text();
      out[url.includes("/v1beta/") ? "v1beta" : "v1"] = {
        ok: res.ok,
        status: res.status,
        body: text,
      };
    } catch (e) {
      out[url.includes("/v1beta/") ? "v1beta" : "v1"] = {
        ok: false,
        status: 0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return out;
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();
  return text.trim();
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in server env" },
      { status: 500 }
    );
  }

  const body = (await req.json()) as ReqBody;
  const hostName = (body.hostName ?? "").trim();
  const msgs = body.messages ?? [];
  if (msgs.length < 1) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const joined = msgs
    .map((m, i) => {
      const cat = m.question_category
        ? ` (category: ${m.question_category})`
        : "";
      return `- [${i + 1}]${cat} ${m.content}`;
    })
    .join("\n");

  const displayName = hostName || "주인공";
  const systemPrompt =
    "너는 다정하고 통찰력 있는 크리스마스 산타클로스야.\n" +
    `주어진 메시지들을 읽고 '${displayName}'(트리 주인)이 올 한 해 주변 사람들에게 어떤 사람이었는지 따뜻한 문체로 3줄 요약해주고,\n` +
    "2026년에 이 사람에게 필요한 '추상적인 가치(예: 휴식, 용기, 낭만)'를 딱 하나의 단어로 선정해서 선물해줘.\n" +
    "호칭은 반드시 '" +
    displayName +
    "님'으로 불러줘.\n" +
    "반환 형식은 JSON으로: { summary: '...', gift_keyword: '...' }";

  const userPrompt = `메시지 목록:\n${joined}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 요청: 1) gemini-1.5-flash-001 우선 2) 실패 시 gemini-pro
    const preferredModel = process.env.GEMINI_MODEL ?? "gemini-1.5-flash-001";
    const modelCandidates = [
      preferredModel,
      "gemini-pro",
      // fallback candidates (프로젝트/계정에 따라 노출 모델이 다를 수 있음)
      // 최신 계정에서 1.0/1.5가 막혀있는 경우가 있어 2.x를 우선 시도
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.0-pro",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      // legacy(열려있으면 동작)
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
    ];

    let text = "";
    let lastErr: unknown = null;
    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(userPrompt);
        text = result.response.text();
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        // 다음 후보로 계속 시도
      }
    }

    if (!text) {
      const detail =
        lastErr instanceof Error ? lastErr.message : String(lastErr);
      const models = await listAvailableModels(apiKey);
      return NextResponse.json(
        {
          error:
            "Gemini request failed (no working model). Your API key may not have access to Generative Language models, or you might be using a wrong kind of key.",
          tried: modelCandidates,
          last_error: detail,
          models,
          hint: "If models.v1beta/v1 shows 403, enable Generative Language API / check key restrictions. If it shows empty or 404, the key is likely not an AI Studio (Generative Language) key.",
        },
        { status: 500 }
      );
    }
    const jsonText = extractJson(text);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Gemini JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: String(parsed.summary ?? ""),
      gift_keyword: String(parsed.gift_keyword ?? ""),
      raw: text,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gemini request failed" },
      { status: 500 }
    );
  }
}
