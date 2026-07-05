"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AVATARS, MAX_RULES, RULE_THENS, RULE_WHENS } from "@/lib/presets";
import type { AgentSpec } from "@/lib/types";

const RULE_XP = 10;

// 行動ルールカード: WHEN × THEN の2枚を組み合わせてルールを作る。
// 成長パス ステージ4「くむ」— 条件分岐・イベント駆動の概念を遊びで体験する。
export default function RulesPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<AgentSpec | null>(null);
  const [selWhen, setSelWhen] = useState<string | null>(null);
  const [selThen, setSelThen] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

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
  const rules = spec.rules ?? [];
  const whenOf = (id: string) => RULE_WHENS.find((w) => w.id === id);
  const thenOf = (id: string) => RULE_THENS.find((t) => t.id === id);
  const isDuplicate =
    selWhen !== null &&
    selThen !== null &&
    rules.some((r) => r.when === selWhen && r.then === selThen);

  const save = (next: AgentSpec) => {
    setSpec(next);
    localStorage.setItem("agent-quest:spec", JSON.stringify(next));
  };

  const addRule = () => {
    if (!selWhen || !selThen || isDuplicate || rules.length >= MAX_RULES) return;
    save({ ...spec, rules: [...rules, { when: selWhen, then: selThen }] });
    const p = localStorage.getItem("agent-quest:progress");
    if (p) {
      const progress = JSON.parse(p);
      progress.xp = (progress.xp ?? 0) + RULE_XP;
      localStorage.setItem("agent-quest:progress", JSON.stringify(progress));
    }
    setSelWhen(null);
    setSelThen(null);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const removeRule = (i: number) => {
    save({ ...spec, rules: rules.filter((_, idx) => idx !== i) });
  };

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <Link href="/play" className="text-sm font-bold opacity-60">
          ← もどる
        </Link>
        <span className="font-extrabold">🧩 ルールカード</span>
        <Link href="/blueprint" className="text-sm font-bold text-sky">
          📐 せっけいず
        </Link>
      </header>

      <p className="mt-3 text-center text-xs opacity-60">
        「〜のときは、〜する」のカードを組み合わせると、
        <br />
        {spec.name}のうごきをプログラムできるよ！
      </p>

      {/* いまのルール */}
      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold opacity-50">
          ⚡ いまのルール（{rules.length}/{MAX_RULES}）
        </p>
        {rules.length === 0 && (
          <p className="rounded-2xl bg-ink/5 px-4 py-3 text-center text-xs opacity-50">
            まだルールがないよ。下でつくってみよう！
          </p>
        )}
        {rules.map((r, i) => (
          <div
            key={`${r.when}-${r.then}`}
            className="anim-pop flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="flex-1 text-sm font-bold">
              {whenOf(r.when)?.emoji}「{whenOf(r.when)?.label}」は
              <br />
              {thenOf(r.then)?.emoji}「{thenOf(r.then)?.label}」
            </span>
            <button
              onClick={() => removeRule(i)}
              className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold transition active:scale-95"
              aria-label="ルールをはずす"
            >
              ✕
            </button>
          </div>
        ))}
        {justAdded && (
          <p className="anim-pop text-center text-sm font-extrabold text-mint">
            ✨ ルールをセットした！（+{RULE_XP} XP）
          </p>
        )}
      </div>

      {/* ビルダー */}
      {rules.length < MAX_RULES ? (
        <div className="mt-5 flex-1">
          <p className="text-[10px] font-bold opacity-50">1️⃣ いつ？</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {RULE_WHENS.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelWhen(w.id)}
                className={`rounded-2xl border-4 bg-white p-3 text-left text-xs font-bold shadow-sm transition active:scale-95 ${
                  selWhen === w.id ? "border-sky" : "border-transparent"
                }`}
              >
                <span className="text-xl">{w.emoji}</span>
                <span className="mt-1 block">{w.label}</span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[10px] font-bold opacity-50">2️⃣ どうする？</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {RULE_THENS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelThen(t.id)}
                className={`rounded-2xl border-4 bg-white p-3 text-left text-xs font-bold shadow-sm transition active:scale-95 ${
                  selThen === t.id ? "border-mint" : "border-transparent"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="mt-1 block">{t.label}</span>
              </button>
            ))}
          </div>

          {/* プレビュー＋作成 */}
          <div className="mt-5 rounded-3xl bg-white p-4 text-center shadow-md">
            <p className="text-sm font-extrabold">
              {selWhen ? (
                `${whenOf(selWhen)?.emoji}「${whenOf(selWhen)?.label}」`
              ) : (
                <span className="opacity-30">いつ？</span>
              )}
              <span className="opacity-50"> は </span>
              {selThen ? (
                `${thenOf(selThen)?.emoji}「${thenOf(selThen)?.label}」`
              ) : (
                <span className="opacity-30">どうする？</span>
              )}
            </p>
            {isDuplicate && (
              <p className="mt-1 text-[10px] font-bold text-coral">
                そのルールはもうセットずみだよ
              </p>
            )}
            <button
              onClick={addRule}
              disabled={!selWhen || !selThen || isDuplicate}
              className="mt-3 w-full rounded-full bg-sky py-3 font-extrabold text-white shadow-lg shadow-sky/40 transition active:scale-95 disabled:opacity-40"
            >
              🧩 ルールをつくる
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-sun/20 px-4 py-3 text-center text-xs font-bold">
          スロットがいっぱい！ルールを✕ではずすと、あたらしいのを作れるよ
        </p>
      )}

      <Link
        href="/play"
        className="mt-5 block rounded-full bg-coral py-3 text-center font-extrabold text-white shadow-lg transition active:scale-95"
      >
        {avatar.emoji} ためしに話してみる
      </Link>
    </main>
  );
}
