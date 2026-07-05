import type { AgentSpec } from "./types";
import { PERSONAS, SKILLS } from "./presets";

// AgentSpec → システムプロンプトのコンパイル（設計書 §7.2）
// ユーザー由来の値（名前）はデリミタ内に閉じ込め、役割・権限の記述はテンプレート側が持つ。
export function buildSystemPrompt(spec: AgentSpec): string {
  const persona =
    PERSONAS.find((p) => p.id === spec.personaId)?.prompt ?? PERSONAS[0].prompt;
  const skillNames = spec.skills
    .map((id) => SKILLS.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join("、");

  const lines = [
    `あなたはユーザーが育てているAIエージェントです。名前は「${sanitizeName(spec.name)}」。`,
    persona,
    spec.kansai ? "関西弁で話してください。" : "",
    spec.emoji
      ? "絵文字をたっぷり使って楽しく話してください。"
      : "絵文字は控えめにしてください。",
    skillNames ? `装備スキル: ${skillNames}。` : "",
    "あなたの得意分野は旅行・おでかけプランの提案です。",
    "行き先の候補は2〜3個にしぼり、それぞれ「見どころ・ごはん・アクセス」を短くまとめてください。",
    "回答は読みやすく、スマホで見て気持ちいい長さ（400字程度）にしてください。",
    spec.skills.includes("web_search")
      ? "最新の情報が必要なときはウェブ検索ツールを使ってください。"
      : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function sanitizeName(name: string): string {
  return name.replace(/[\n\r<>]/g, "").slice(0, 20) || "エージェント";
}
