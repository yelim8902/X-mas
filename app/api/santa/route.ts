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
    console.error("[Santa API] GEMINI_API_KEY is missing");
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in server env" },
      { status: 500 }
    );
  }

  console.error("[Santa API] API key present:", {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 8) + "...",
  });

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

    // 사용 가능한 안정적인 모델 사용: gemini-2.5-flash를 1순위로
    // gemini-1.5-flash/pro는 더 이상 사용할 수 없으므로 2.5/2.0 시리즈 사용
    const modelCandidates = [
      "gemini-2.5-flash", // 가장 안정적인 최신 모델
      "gemini-2.0-flash-001", // 안정 버전
      "gemini-2.0-flash", // fallback
    ];

    console.error("[Santa API] Starting Gemini request", {
      candidates: modelCandidates,
      messageCount: msgs.length,
      hostName: displayName,
    });

    let text = "";
    let lastErr: unknown = null;
    let successfulModel: string | null = null;

    for (const modelName of modelCandidates) {
      try {
        console.error(`[Santa API] Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(userPrompt);
        text = result.response.text();
        successfulModel = modelName;
        console.error(`[Santa API] Success with model: ${modelName}`, {
          responseLength: text.length,
        });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorStack = e instanceof Error ? e.stack : undefined;
        console.error(`[Santa API] Model ${modelName} failed:`, {
          error: errorMessage,
          stack: errorStack,
          errorType: e?.constructor?.name,
        });
        // 다음 후보로 계속 시도
      }
    }

    if (!text) {
      const detail =
        lastErr instanceof Error ? lastErr.message : String(lastErr);
      const errorStack = lastErr instanceof Error ? lastErr.stack : undefined;

      console.error("[Santa API] All models failed", {
        tried: modelCandidates,
        lastError: detail,
        lastErrorStack: errorStack,
        apiKeyPresent: !!apiKey,
        apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : "missing",
      });

      // API 키 권한 확인을 위한 상세 정보 수집
      const models = await listAvailableModels(apiKey);
      console.error("[Santa API] Available models check:", models);

      // 에러 상세 정보를 클라이언트에 전달 (디버깅용)
      const errorResponse = {
        error:
          "Gemini request failed (no working model). Your API key may not have access to Generative Language models, or you might be using a wrong kind of key.",
        tried: modelCandidates,
        last_error: detail,
        models,
        hint: "If models.v1beta/v1 shows 403, enable Generative Language API / check key restrictions. If it shows empty or 404, the key is likely not an AI Studio (Generative Language) key.",
      };

      // 서버 로그에 상세 정보 출력
      console.error(
        "[Santa API] Full error response:",
        JSON.stringify(errorResponse, null, 2)
      );

      return NextResponse.json(errorResponse, { status: 500 });
    }

    const jsonText = extractJson(text);
    console.error("[Santa API] Extracted JSON text", {
      length: jsonText.length,
      preview: jsonText.substring(0, 200),
    });

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
      console.error("[Santa API] Successfully parsed JSON", {
        hasSummary: !!parsed.summary,
        hasGiftKeyword: !!parsed.gift_keyword,
        model: successfulModel,
      });
    } catch (parseError) {
      console.error("[Santa API] JSON parse failed", {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
        jsonText,
        rawText: text,
      });
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
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;
    console.error("[Santa API] Unexpected error", {
      error: errorMessage,
      stack: errorStack,
      errorType: e?.constructor?.name,
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
