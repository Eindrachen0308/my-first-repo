import type { AgentSpec } from "./types";

// 試遊リンク: AgentSpec を URL セーフな base64 にエンコードして共有する。
// プロトタイプ用のDB不要な実装。Phase 1 では公開エージェントID方式に置き換える。

export function encodeSpec(spec: AgentSpec): string {
  const bytes = new TextEncoder().encode(JSON.stringify(spec));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSpec(encoded: string): AgentSpec | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const spec = JSON.parse(new TextDecoder().decode(bytes)) as AgentSpec;
    if (!spec || typeof spec.name !== "string" || !Array.isArray(spec.skills)) {
      return null;
    }
    return spec;
  } catch {
    return null;
  }
}
