// エージェントの実体 = 宣言的スペック（設計書 ADR-1）
export type AgentSpec = {
  name: string;
  avatarId: string;
  personaId: string;
  kansai: boolean;
  emoji: boolean;
  skills: string[]; // skill id の配列（最大2スロット）
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
