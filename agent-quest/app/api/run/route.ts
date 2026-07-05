import { NextRequest } from "next/server";
import type { AgentSpec, ChatMessage, RunEvent } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/prompt";
import { XP_PER_RUN } from "@/lib/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 実行イベントを NDJSON でストリーミングする（設計書 §5.3 の観戦チャンネルの原型）。
// ANTHROPIC_API_KEY があれば Claude API に実接続、なければ（またはAPIエラー時は）
// モック実行に自動フォールバックし、デモが止まらないようにする。
export async function POST(req: NextRequest) {
  const { spec, messages, questId } = (await req.json()) as {
    spec: AgentSpec;
    messages: ChatMessage[];
    questId?: string;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: RunEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            await runWithClaude(spec, messages, questId, emit);
          } catch (err) {
            console.error("Claude API failed, falling back to mock:", err);
            await runMock(spec, messages, questId, emit);
          }
        } else {
          await runMock(spec, messages, questId, emit);
        }
      } catch (err) {
        emit({ type: "error", message: "実行中にエラーが発生しました" });
        console.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

async function runWithClaude(
  spec: AgentSpec,
  messages: ChatMessage[],
  questId: string | undefined,
  emit: (e: RunEvent) => void,
) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  emit({ type: "thought", text: "どうこたえよう、考え中…" });

  const tools = spec.skills.includes("web_search")
    ? [
        {
          type: "web_search_20250305" as const,
          name: "web_search" as const,
          max_uses: 3,
        },
      ]
    : undefined;

  const stream = client.messages.stream({
    model: process.env.AGENT_MODEL || "claude-sonnet-5",
    max_tokens: 1500,
    system: buildSystemPrompt(spec, questId),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools,
  });

  // content block index ごとの状態（ツール入力のJSONを組み立てて発火時に使う）
  const blocks = new Map<number, { type: string; inputJson: string }>();

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      const block = event.content_block;
      blocks.set(event.index, { type: block.type, inputJson: "" });
      if (block.type === "web_search_tool_result") {
        emit({
          type: "tool_result",
          tool: "web_search",
          label: "じょうほうをゲット！",
        });
      }
    } else if (event.type === "content_block_delta") {
      const state = blocks.get(event.index);
      if (event.delta.type === "text_delta") {
        emit({ type: "message_delta", text: event.delta.text });
      } else if (event.delta.type === "input_json_delta" && state) {
        state.inputJson += event.delta.partial_json;
      }
    } else if (event.type === "content_block_stop") {
      const state = blocks.get(event.index);
      if (state?.type === "server_tool_use") {
        let query = "";
        try {
          query = JSON.parse(state.inputJson || "{}").query ?? "";
        } catch {
          // 部分的なJSONは無視してクエリ無しで演出する
        }
        emit({
          type: "tool_call",
          tool: "web_search",
          label: "スキル発動！ウェブけんさく",
          query,
        });
      }
    }
  }

  emit({ type: "done", xp: XP_PER_RUN, mock: false });
}

// ---- モック実行（APIキー無し環境・APIエラー時のフォールバック） ----

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DESTINATIONS: Record<string, string[]> = {
  箱根: ["箱根神社と芦ノ湖の海賊船", "天山湯治郷の日帰り温泉", "ロマンスカーで新宿から約85分"],
  鎌倉: ["鶴岡八幡宮と小町通り食べ歩き", "由比ヶ浜でしらす丼", "都内から横須賀線で約1時間"],
  秩父: ["長瀞ラインくだり", "わらじカツ丼と豚みそ丼", "池袋から特急ラビューで約80分"],
};

const KONDATE: [string, string, string][] = [
  ["ふわとろ親子丼", "小松菜のおひたし", "15分でできる時短メニュー"],
  ["回鍋肉（ホイコーロー）", "わかめスープ", "キャベツと豚肉を大量消費"],
  ["鮭のホイル焼き", "きのこのおみそ汁", "洗い物が少なくてラクチン"],
];

async function runMock(
  spec: AgentSpec,
  messages: ChatMessage[],
  questId: string | undefined,
  emit: (e: RunEvent) => void,
) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser?.content ?? "";
  const isKondate =
    questId === "kondate" ||
    /献立|こんだて|ごはん|ご飯|レシピ|ばんごはん|晩ごはん|夕飯|料理|食材/.test(
      text,
    );

  await sleep(500);
  emit({
    type: "thought",
    text: isKondate
      ? "おなかすいてきた…おいしいのを考えるぞ！"
      : "うーん、週末のおでかけかぁ…ワクワクする！",
  });
  await sleep(900);

  if (spec.skills.includes("web_search")) {
    emit({
      type: "tool_call",
      tool: "web_search",
      label: "スキル発動！ウェブけんさく",
      query: isKondate ? "今週 人気 かんたん 献立" : "箱根 週末 日帰り おすすめ",
    });
    await sleep(1100);
    emit({
      type: "tool_result",
      tool: "web_search",
      label: "5けんの情報をゲット！",
    });
    await sleep(700);
  }

  emit({
    type: "thought",
    text: isKondate ? "きまった！自信作ができたよ" : "よさそうなプランがみえてきた…！",
  });
  await sleep(800);

  const reply = applyMockRules(
    spec,
    isKondate ? buildKondateReply(spec) : buildTravelReply(spec, text),
  );

  // 文字を少しずつ流してストリーミング感を出す
  for (const chunk of chunkString(reply, 6)) {
    emit({ type: "message_delta", text: chunk });
    await sleep(35);
  }

  emit({ type: "done", xp: XP_PER_RUN, mock: true });
}

function buildTravelReply(spec: AgentSpec, text: string): string {
  const dest = Object.keys(DESTINATIONS).find((d) => text.includes(d)) ?? "箱根";
  const [spot, food, access] = DESTINATIONS[dest];
  const ex = spec.emoji;
  return [
    `${ex ? "🎒✨ " : ""}週末のおでかけなら「${dest}」がおすすめ！`,
    ``,
    `${ex ? "📍 " : "・"}見どころ: ${spot}`,
    `${ex ? "🍽️ " : "・"}ごはん: ${food}`,
    `${ex ? "🚃 " : "・"}アクセス: ${access}`,
    ``,
    `朝はやめに出発すれば、夕方までゆっくり楽しめるよ${ex ? "☀️" : ""}`,
    `気になったら「くわしく！」って聞いてね${ex ? "💪" : "!"}`,
  ].join("\n");
}

function buildKondateReply(spec: AgentSpec): string {
  const ex = spec.emoji;
  const lines = [`${ex ? "🍳✨ " : ""}今週のばんごはん、この3つはどう？`, ``];
  KONDATE.forEach(([main, side, point], i) => {
    lines.push(
      `${ex ? ["1️⃣", "2️⃣", "3️⃣"][i] : `${i + 1}.`} ${main}`,
      `　${ex ? "🥗 " : "・"}サイド: ${side}`,
      `　${ex ? "💡 " : "・"}ポイント: ${point}`,
      ``,
    );
  });
  lines.push(`食材や気分をおしえてくれたら、もっとぴったりの案を出すよ${ex ? "😋" : "!"}`);
  return lines.join("\n");
}

// モックでも行動ルールの効果を体感できるようにする（「くむ→ためす」ループの担保）
function applyMockRules(spec: AgentSpec, reply: string): string {
  const thens = new Set((spec.rules ?? []).map((r) => r.then));
  const ex = spec.emoji;
  let out = reply;
  if (thens.has("praise")) {
    out = `そのしつもん、いいね！${ex ? "💖" : ""}\n\n${out}`;
  }
  if (thens.has("reason")) {
    out += `\n\nちなみに理由はね、みんなの口コミ評価が高くて、いま行きやすい（作りやすい）からだよ${ex ? "🧠" : "!"}`;
  }
  if (thens.has("advice")) {
    out += `\n\n${ex ? "💡 " : ""}アドバイス: 早めに予定を決めると、もっと楽しめるよ！`;
  }
  if (thens.has("question")) {
    out += `\n\nきみはどれが気になった？${ex ? "❓" : ""}`;
  }
  return out;
}

function chunkString(s: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
