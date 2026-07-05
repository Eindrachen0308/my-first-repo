"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AVATARS, PERSONAS, RULE_THENS, RULE_WHENS, SKILLS } from "@/lib/presets";
import type { AgentSpec } from "@/lib/types";

// せっけいず: 成長パス ステージ5「よむ」。
// ゲームで作ったエージェントの実体が「構造化データ」であることを、
// 本人のタイミングで発見させる画面（押し付けない・開きたい人だけが開く）。
export default function BlueprintPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<AgentSpec | null>(null);
  const [showCode, setShowCode] = useState(false);

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
  const persona = PERSONAS.find((p) => p.id === spec.personaId);

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <Link href="/play" className="text-sm font-bold opacity-60">
          ← もどる
        </Link>
        <span className="font-extrabold">📐 せっけいず</span>
        <Link href="/workshop" className="text-sm font-bold text-sky">
          🔧 改造する
        </Link>
      </header>

      <div className="mt-5 flex flex-col items-center">
        <span className="text-6xl">{avatar.emoji}</span>
        <p className="mt-1 font-extrabold">{spec.name}のなかみ</p>
      </div>

      <div className="mt-5 space-y-3">
        <Card title="🎭 せいかく">
          <p className="font-bold">
            {persona?.emoji} {persona?.label}
          </p>
          <p className="mt-1 text-xs opacity-60">{persona?.desc}</p>
          <div className="mt-2 flex gap-2 text-[10px] font-bold">
            <span className="rounded-full bg-cream px-2 py-1">
              関西弁: {spec.kansai ? "オン" : "オフ"}
            </span>
            <span className="rounded-full bg-cream px-2 py-1">
              絵文字: {spec.emoji ? "たっぷり" : "ひかえめ"}
            </span>
          </div>
        </Card>

        <Card title="🎒 スキル">
          {spec.skills.length > 0 ? (
            <div className="space-y-1">
              {spec.skills.map((id) => {
                const s = SKILLS.find((k) => k.id === id);
                return (
                  <p key={id} className="text-sm font-bold">
                    {s?.emoji} {s?.name}
                    <span className="ml-2 text-[10px] font-normal opacity-50">
                      {s?.desc}
                    </span>
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-xs opacity-50">まだ装備していないよ</p>
          )}
        </Card>

        <Card title="🧩 行動ルール">
          {(spec.rules ?? []).length > 0 ? (
            <div className="space-y-1">
              {(spec.rules ?? []).map((r) => {
                const w = RULE_WHENS.find((x) => x.id === r.when);
                const t = RULE_THENS.find((x) => x.id === r.then);
                return (
                  <p key={`${r.when}-${r.then}`} className="text-xs font-bold">
                    {w?.emoji}「{w?.label}」は {t?.emoji}「{t?.label}」
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-xs opacity-50">
              （まだないよ。
              <Link href="/rules" className="text-sky underline">
                ルールカード
              </Link>
              で組めるよ）
            </p>
          )}
        </Card>

        <Card title="📝 こだわりメモ">
          <p className="whitespace-pre-wrap text-xs">
            {spec.customInstructions || "（まだないよ。改造こうぼうで育つよ）"}
          </p>
        </Card>
      </div>

      {/* ステージ5の仕掛け: 中身はただのデータだった、という発見 */}
      <button
        onClick={() => setShowCode((v) => !v)}
        className="mt-6 rounded-full bg-ink/10 py-3 text-sm font-extrabold transition active:scale-95"
      >
        {showCode ? "とじる" : "👀 コードのなかみをのぞく"}
      </button>
      {showCode && (
        <div className="anim-pop mt-3">
          <pre className="overflow-x-auto rounded-2xl bg-ink p-4 text-[11px] leading-relaxed text-mint">
            {JSON.stringify(spec, null, 2)}
          </pre>
          <p className="mt-2 text-center text-[10px] font-bold opacity-60">
            これが{spec.name}の「せっけいず」。
            <br />
            きみが作ってたのは、じつはこういうデータなんだ！
            <br />
            エンジニアはこれを「JSON」ってよんでるよ。
          </p>
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold opacity-50">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
