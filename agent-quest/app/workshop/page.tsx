"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AVATARS } from "@/lib/presets";
import type { AgentSpec, CraftResult } from "@/lib/types";

const CRAFT_XP = 10;

const IDEA_CHIPS = [
  "けいさんスキルをつけて",
  "もっと関西弁つよめにして",
  "ツンデレにして",
  "語尾に「なのだ」ってつけて",
];

type Phase = "idle" | "building" | "review" | "applied";

// 改造こうぼう: 「指示するとエージェントが変わる」= Claude Code体験の入口。
// 指示 → スペック差分（diff表示）→ はんえい、の開発フローをそのまま遊びにする。
export default function WorkshopPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<AgentSpec | null>(null);
  const [instruction, setInstruction] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CraftResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("agent-quest:spec");
    if (!raw) {
      router.replace("/craft");
      return;
    }
    setSpec(JSON.parse(raw));
  }, [router]);

  if (!spec) return null;
  const avatar = AVATARS.find((a) => a.id === spec.avatarId) ?? AVATARS[0];

  const build = async (text: string) => {
    if (phase === "building" || !text.trim()) return;
    setPhase("building");
    setInstruction("");
    const started = Date.now();
    try {
      const res = await fetch("/api/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, instruction: text.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = (await res.json()) as CraftResult;
      // ハンマー演出を最低1.2秒は見せる（「作っている感」の担保）
      const wait = Math.max(0, 1200 - (Date.now() - started));
      setTimeout(() => {
        setResult(r);
        setPhase("review");
      }, wait);
    } catch {
      setResult({
        spec,
        changes: [],
        comment: "⚠️ つうしんエラー。もういちど試してね",
      });
      setPhase("review");
    }
  };

  const apply = () => {
    if (!result) return;
    localStorage.setItem("agent-quest:spec", JSON.stringify(result.spec));
    const p = localStorage.getItem("agent-quest:progress");
    if (p) {
      const progress = JSON.parse(p);
      progress.xp = (progress.xp ?? 0) + CRAFT_XP;
      localStorage.setItem("agent-quest:progress", JSON.stringify(progress));
    }
    setSpec(result.spec);
    setPhase("applied");
  };

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-6 pt-4">
      <header className="flex items-center justify-between">
        <Link href="/play" className="text-sm font-bold opacity-60">
          ← もどる
        </Link>
        <span className="font-extrabold">🔧 改造こうぼう</span>
        <Link href="/blueprint" className="text-sm font-bold text-sky">
          📐 せっけいず
        </Link>
      </header>

      {/* エージェントの現在のすがた */}
      <div className="mt-5 flex flex-col items-center">
        <span
          className={`text-7xl ${phase === "building" ? "anim-wiggle inline-block" : "anim-float inline-block"}`}
        >
          {phase === "building" ? "🔨" : avatar.emoji}
        </span>
        <p className="mt-2 font-extrabold">
          {phase === "building" ? "カンカンカン…改造中！" : spec.name}
        </p>
        {phase === "idle" && (
          <p className="mt-1 text-center text-xs opacity-60">
            ことばで指示すると、{spec.name}のなかみが変わるよ。
            <br />
            エンジニアみたいに注文してみよう！
          </p>
        )}
      </div>

      <div className="mt-5 flex-1">
        {/* 差分（diff）レビュー */}
        {(phase === "review" || phase === "applied") && result && (
          <div className="anim-pop">
            <div className="rounded-3xl bg-white p-5 shadow-md">
              <p className="text-center text-sm font-extrabold">
                {avatar.emoji} 「{result.comment}」
              </p>
              {result.changes.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold opacity-50">
                    へんこう内容（{result.changes.length}件）
                  </p>
                  {result.changes.map((c) => (
                    <div
                      key={c.label}
                      className="rounded-2xl border-2 border-mint/40 bg-mint/5 px-3 py-2"
                    >
                      <div className="text-xs font-extrabold">{c.label}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs">
                        <span className="rounded bg-coral/10 px-2 py-0.5 line-through opacity-60">
                          {c.before}
                        </span>
                        <span className="font-extrabold text-mint">→</span>
                        <span className="rounded bg-mint/15 px-2 py-0.5 font-bold">
                          {c.after}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-center text-xs opacity-60">
                  へんこうはなかったよ。べつの言い方で注文してみて！
                </p>
              )}
            </div>

            {phase === "review" && result.changes.length > 0 && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setPhase("idle")}
                  className="rounded-full bg-ink/10 px-6 py-3 font-bold transition active:scale-95"
                >
                  やめとく
                </button>
                <button
                  onClick={apply}
                  className="flex-1 rounded-full bg-mint py-3 font-extrabold text-white shadow-lg shadow-mint/40 transition active:scale-95"
                >
                  ✅ はんえいする
                </button>
              </div>
            )}
            {phase === "review" && result.changes.length === 0 && (
              <button
                onClick={() => setPhase("idle")}
                className="mt-4 w-full rounded-full bg-ink/10 py-3 font-bold transition active:scale-95"
              >
                もういちど
              </button>
            )}
            {phase === "applied" && (
              <div className="anim-pop mt-4 text-center">
                <p className="font-extrabold text-mint">
                  ✨ はんえいした！（+{CRAFT_XP} XP）
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => setPhase("idle")}
                    className="flex-1 rounded-full bg-ink/10 py-3 font-bold transition active:scale-95"
                  >
                    つづけて改造
                  </button>
                  <Link
                    href="/play"
                    className="flex-1 rounded-full bg-coral py-3 text-center font-extrabold text-white shadow-lg transition active:scale-95"
                  >
                    ためしに話す
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* アイデアチップ */}
        {phase === "idle" && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold opacity-50">
              たとえばこんな注文…
            </p>
            {IDEA_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => build(c)}
                className="rounded-2xl border-2 border-sky/40 bg-white px-4 py-3 text-left text-sm font-bold transition active:scale-95"
              >
                💡 {c}
              </button>
            ))}
            <Link
              href="/rules"
              className="mt-1 rounded-2xl border-2 border-dashed border-sky/40 px-4 py-3 text-center text-sm font-bold text-sky transition active:scale-95"
            >
              🧩 「〜のときは〜する」を組むならルールカードへ →
            </Link>
          </div>
        )}
      </div>

      {/* 指示入力 */}
      {(phase === "idle" || phase === "building") && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            build(instruction);
          }}
        >
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="どんなふうに改造する？"
            disabled={phase === "building"}
            className="flex-1 rounded-full border-2 border-ink/10 bg-white px-5 py-3 text-sm font-bold outline-none focus:border-sky disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={phase === "building" || !instruction.trim()}
            className="rounded-full bg-sky px-5 py-3 font-extrabold text-white shadow-md transition active:scale-95 disabled:opacity-40"
          >
            🔨 改造
          </button>
        </form>
      )}
    </main>
  );
}
