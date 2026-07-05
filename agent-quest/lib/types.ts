// エージェントの実体 = 宣言的スペック（設計書 ADR-1）
export type AgentSpec = {
  name: string;
  avatarId: string;
  personaId: string;
  kansai: boolean;
  emoji: boolean;
  skills: string[]; // skill id の配列（最大2スロット）
  customInstructions?: string; // 「こだわりメモ」（自由記述・改造こうぼうで育つ）
  rules?: AgentRule[]; // 行動ルールカード（「〜のときは〜する」）
};

// 行動ルール = WHEN カード × THEN カード の組み合わせ（idで保持）
export type AgentRule = { when: string; then: string };

// 改造こうぼう: 自然言語の指示 → スペック差分（Claude Code的体験の原型）
export type CraftChange = { label: string; before: string; after: string };
export type CraftResult = {
  spec: AgentSpec;
  changes: CraftChange[];
  comment: string; // エージェントからのひとこと
};

// 実行ストリームのイベント（設計書 §7.4 の観戦プロトコルの原型）
export type RunEvent =
  | { type: "thought"; text: string }
  | { type: "tool_call"; tool: string; label: string; query?: string }
  | { type: "tool_result"; tool: string; label: string }
  | { type: "message_delta"; text: string }
  | { type: "done"; xp: number; mock: boolean }
  | { type: "error"; message: string };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
