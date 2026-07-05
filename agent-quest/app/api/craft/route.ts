import { NextRequest } from "next/server";
import type { AgentSpec, CraftChange, CraftResult } from "@/lib/types";
import { MAX_SKILL_SLOTS, PERSONAS, SKILLS } from "@/lib/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 改造こうぼう: 自然言語の指示を AgentSpec の差分に変換する。
// Claude Code の「指示→コードが変わる」体験を、宣言的スペックの上で再現する
// （設計書 ADR-1: 任意コードは実行せず、変更は必ず検証済みのスペックに落ちる）。
export async function POST(req: NextRequest) {
  const { spec, instruction } = (await req.json()) as {
    spec: AgentSpec;
    instruction: string;
  };
  const inst = (instruction ?? "").slice(0, 300);

  let result: CraftResult;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = await craftWithClaude(spec, inst);
    } catch (err) {
      console.error("Claude craft failed, falling back to mock:", err);
      result = craftMock(spec, inst);
    }
  } else {
    result = craftMock(spec, inst);
  }

  return Response.json(result);
}

// ---- 実API: ツール強制呼び出しで構造化されたスペック更新を受け取る ----

async function craftWithClaude(
  spec: AgentSpec,
  instruction: string,
): Promise<CraftResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const res = await client.messages.create({
    model: process.env.AGENT_MODEL || "claude-sonnet-5",
    max_tokens: 700,
    system: [
      "あなたはAIエージェント育成アプリの「改造こうぼう」です。",
      "飼い主の要望を、エージェントの設定値の更新に翻訳してください。",
      "変更しない項目は現在の値をそのまま返してください。",
      "設定項目で表現できない要望（口調の細かいニュアンス等)は customInstructions に短く追記してください。",
      "comment には、エージェント本人になりきった改造後のひとこと(40字以内)を入れてください。",
      `現在の設定: ${JSON.stringify(spec)}`,
    ].join("\n"),
    messages: [{ role: "user", content: instruction }],
    tools: [
      {
        name: "update_agent_spec",
        description: "エージェントの設定を更新する",
        input_schema: {
          type: "object" as const,
          properties: {
            personaId: {
              type: "string",
              enum: PERSONAS.map((p) => p.id),
              description: "性格タイプ",
            },
            kansai: { type: "boolean", description: "関西弁で話すか" },
            emoji: { type: "boolean", description: "絵文字をたっぷり使うか" },
            skills: {
              type: "array",
              items: { type: "string", enum: SKILLS.map((s) => s.id) },
              maxItems: MAX_SKILL_SLOTS,
              description: "装備スキル（最大2つ）",
            },
            customInstructions: {
              type: "string",
              description: "こだわりメモ（口調・振る舞いの自由記述、200字以内）",
            },
            comment: { type: "string", description: "エージェントのひとこと" },
          },
          required: ["personaId", "kansai", "emoji", "skills", "comment"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "update_agent_spec" },
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("no tool_use block");
  }
  const patch = toolUse.input as Record<string, unknown>;
  const next = sanitize(spec, patch);
  const comment =
    typeof patch.comment === "string"
      ? patch.comment.slice(0, 60)
      : "できたよ！";
  return { spec: next, changes: diff(spec, next), comment };
}

// パッチ検証: LLMの出力は信用せず、必ず許可リストと突合してからスペックに反映する
function sanitize(spec: AgentSpec, patch: Record<string, unknown>): AgentSpec {
  const personaId =
    typeof patch.personaId === "string" &&
    PERSONAS.some((p) => p.id === patch.personaId)
      ? (patch.personaId as string)
      : spec.personaId;
  const skills = Array.isArray(patch.skills)
    ? [
        ...new Set(
          patch.skills.filter(
            (s): s is string =>
              typeof s === "string" && SKILLS.some((k) => k.id === s),
          ),
        ),
      ].slice(0, MAX_SKILL_SLOTS)
    : spec.skills;
  return {
    ...spec,
    personaId,
    kansai: typeof patch.kansai === "boolean" ? patch.kansai : spec.kansai,
    emoji: typeof patch.emoji === "boolean" ? patch.emoji : spec.emoji,
    skills: skills.length > 0 ? skills : spec.skills,
    customInstructions:
      typeof patch.customInstructions === "string"
        ? patch.customInstructions.slice(0, 200)
        : spec.customInstructions,
  };
}

// ---- モック: キーワードルールで指示をスペック差分に変換 ----

function craftMock(spec: AgentSpec, instruction: string): CraftResult {
  const next: AgentSpec = { ...spec, skills: [...spec.skills] };
  const off = /(やめて|なし|オフ|禁止|ひかえめ)/.test(instruction);

  if (/関西弁/.test(instruction)) next.kansai = !off;
  if (/絵文字/.test(instruction)) next.emoji = !off;

  const personaMap: [RegExp, string][] = [
    [/ツンデレ|クール|冷静/, "cool"],
    [/げんき|元気|明るく/, "genki"],
    [/おっとり|やさしく|優しく|いやし|癒や?し/, "ottori"],
    [/ものしり|物知り|はかせ|博士|かしこ/, "monoshiri"],
  ];
  for (const [re, id] of personaMap) {
    if (re.test(instruction)) {
      next.personaId = id;
      break;
    }
  }

  const skillMap: [RegExp, string][] = [
    [/けいさん|計算/, "calc"],
    [/メモ|プラン形式|まとめ/, "memo"],
    [/けんさく|検索/, "web_search"],
  ];
  for (const [re, id] of skillMap) {
    if (!re.test(instruction)) continue;
    if (/はずして|外して|やめて/.test(instruction)) {
      next.skills = next.skills.filter((s) => s !== id);
    } else if (!next.skills.includes(id)) {
      if (next.skills.length >= MAX_SKILL_SLOTS) next.skills.pop();
      next.skills.push(id);
    }
  }

  let changes = diff(spec, next);
  // どの設定にも該当しなければ「こだわりメモ」に追記する（指示は無駄にしない）
  if (changes.length === 0 && instruction.trim()) {
    const memo = [spec.customInstructions, instruction.trim()]
      .filter(Boolean)
      .join(" / ")
      .slice(0, 200);
    next.customInstructions = memo;
    changes = diff(spec, next);
  }

  const comment =
    changes.length > 0
      ? next.emoji
        ? "改造かんりょう！新しいわたし、どう？✨"
        : "改造かんりょう。新しいわたし、どう？"
      : "うーん、そのままでも十分イケてる気がする！";
  return { spec: next, changes, comment };
}

// ---- 差分計算（UIに「diff」として見せる。ステージ5「よむ」への布石） ----

function diff(a: AgentSpec, b: AgentSpec): CraftChange[] {
  const changes: CraftChange[] = [];
  const personaLabel = (id: string) =>
    PERSONAS.find((p) => p.id === id)?.label ?? id;
  const skillLabels = (ids: string[]) =>
    ids.map((id) => SKILLS.find((s) => s.id === id)?.name ?? id).join("、") ||
    "なし";

  if (a.personaId !== b.personaId) {
    changes.push({
      label: "🎭 せいかく",
      before: personaLabel(a.personaId),
      after: personaLabel(b.personaId),
    });
  }
  if (a.kansai !== b.kansai) {
    changes.push({
      label: "🗣️ 関西弁",
      before: a.kansai ? "オン" : "オフ",
      after: b.kansai ? "オン" : "オフ",
    });
  }
  if (a.emoji !== b.emoji) {
    changes.push({
      label: "😊 絵文字",
      before: a.emoji ? "たっぷり" : "ひかえめ",
      after: b.emoji ? "たっぷり" : "ひかえめ",
    });
  }
  if (a.skills.join(",") !== b.skills.join(",")) {
    changes.push({
      label: "🎒 スキル",
      before: skillLabels(a.skills),
      after: skillLabels(b.skills),
    });
  }
  if ((a.customInstructions ?? "") !== (b.customInstructions ?? "")) {
    changes.push({
      label: "📝 こだわりメモ",
      before: a.customInstructions?.slice(0, 40) || "（なし）",
      after: b.customInstructions?.slice(0, 40) || "（なし）",
    });
  }
  return changes;
}
