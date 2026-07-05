"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVATARS,
  MAX_ENERGY,
  QUESTS,
  XP_PER_LEVEL,
} from "@/lib/presets";
import { encodeSpec } from "@/lib/share";
import type { AgentSpec, ChatMessage, RunEvent } from "@/lib/types";
import { LogRow, TypingDots, type LogItem } from "@/components/RunLog";

type Progress = { xp: number; energy: number; cleared: string[] };

const DEFAULT_PROGRESS: Progress = { xp: 0, energy: MAX_ENERGY, cleared: [] };

export default function PlayPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<AgentSpec | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [clearedQuestId, setClearedQuestId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("agent-quest:spec");
    if (!raw) {
      router.replace("/craft");
      return;
    }
    setSpec(JSON.parse(raw));
    const p = localStorage.getItem("agent-quest:progress");
    if (p) {
      const parsed = JSON.parse(p);
      // 旧フォーマット（questDone）からの移行も兼ねてデフォルトで埋める
      setProgress({ ...DEFAULT_PROGRESS, ...parsed, cleared: parsed.cleared ?? [] });
    }
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const saveProgress = (p: Progress) => {
    setProgress(p);
    localStorage.setItem("agent-quest:progress", JSON.stringify(p));
  };

  if (!spec) return null;

  const avatar = AVATARS.find((a) => a.id === spec.avatarId) ?? AVATARS[0];
  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1;
  const xpInLevel = progress.xp % XP_PER_LEVEL;
  const currentQuest = QUESTS.find((q) => !progress.cleared.includes(q.id));
  const clearedQuest = QUESTS.find((q) => q.id === clearedQuestId);
  const nextQuest = clearedQuest
    ? QUESTS[QUESTS.indexOf(clearedQuest) + 1]
    : undefined;

  const shareUrl = () =>
    `${window.location.origin}/try?s=${encodeSpec(spec)}`;

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可の環境では入力欄の全選択で代替
    }
  };

  const send = async (text: string) => {
    if (running || !text.trim() || progress.energy <= 0) return;
    setRunning(true);
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setLog((l) => [...l, { kind: "user", text: userMsg.content }]);

    let agentText = "";
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec,
          messages: newHistory,
          questId: currentQuest?.id,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as RunEvent;
          if (ev.type === "thought") {
            setLog((l) => [...l, { kind: "thought", text: ev.text }]);
          } else if (ev.type === "tool_call") {
            setLog((l) => [
              ...l,
              { kind: "skill", label: ev.label, query: ev.query },
            ]);
          } else if (ev.type === "tool_result") {
            setLog((l) => [...l, { kind: "skill_result", label: ev.label }]);
          } else if (ev.type === "message_delta") {
            agentText += ev.text;
            setLog((l) => {
              const last = l[l.length - 1];
              if (last?.kind === "agent" && last.streaming) {
                return [
                  ...l.slice(0, -1),
                  { kind: "agent", text: agentText, streaming: true },
                ];
              }
              return [...l, { kind: "agent", text: agentText, streaming: true }];
            });
          } else if (ev.type === "done") {
            const firstClear = currentQuest !== undefined;
            const bonus = firstClear ? currentQuest.xp : 0;
            saveProgress({
              xp: progress.xp + ev.xp + bonus,
              energy: progress.energy - 1,
              cleared: firstClear
                ? [...progress.cleared, currentQuest.id]
                : progress.cleared,
            });
            setXpToast(ev.xp + bonus);
            setTimeout(() => setXpToast(null), 2000);
            if (firstClear) {
              setTimeout(() => setClearedQuestId(currentQuest.id), 800);
            }
          } else if (ev.type === "error") {
            setLog((l) => [
              ...l,
              { kind: "thought", text: `⚠️ ${ev.message}` },
            ]);
          }
        }
      }
    } catch {
      setLog((l) => [
        ...l,
        { kind: "thought", text: "⚠️ つうしんエラー。もういちど試してね" },
      ]);
    } finally {
      // ストリーミング終了をログに反映
      setLog((l) =>
        l.map((item) =>
          item.kind === "agent" ? { ...item, streaming: false } : item,
        ),
      );
      if (agentText) {
        setHistory((h) => [...h, { role: "assistant", content: agentText }]);
      }
      setRunning(false);
    }
  };

  return (
    <main className="flex h-dvh flex-col">
      {/* ヘッダー: ステータス */}
      <header className="flex items-center gap-3 border-b border-ink/10 bg-white px-4 py-3">
        <span className="text-4xl">{avatar.emoji}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold">{spec.name}</span>
            <span className="text-xs font-bold text-coral">Lv.{level}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-sun transition-all duration-700"
              style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
        </div>
        <a
          href="/workshop"
          className="rounded-full bg-mint/20 px-3 py-2 text-lg transition active:scale-95"
          aria-label="改造こうぼう"
        >
          🔧
        </a>
        <button
          onClick={() => setShowShare(true)}
          className="rounded-full bg-sky/20 px-3 py-2 text-lg transition active:scale-95"
          aria-label="シェア"
        >
          📣
        </button>
        <div className="text-right">
          <div className="text-sm font-extrabold">
            ⚡ {progress.energy}
            <span className="opacity-40">/{MAX_ENERGY}</span>
          </div>
          <div className="text-[10px] opacity-40">エナジー</div>
        </div>
      </header>

      {/* クエストバナー */}
      {currentQuest ? (
        <div className="mx-4 mt-3 rounded-2xl bg-lavender/25 px-4 py-3">
          <div className="text-[10px] font-bold text-lavender">
            ⭐ {currentQuest.title}
          </div>
          <div className="text-sm font-extrabold">
            {currentQuest.emoji} {currentQuest.goal}
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-3 rounded-2xl bg-sun/20 px-4 py-3 text-center text-sm font-extrabold">
          🏆 クエストぜんぶクリア！つぎのクエストをまっててね
        </div>
      )}

      {/* ログ（チャット＋戦闘ログ風演出） */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {log.length === 0 && (
          <div className="pt-8 text-center">
            <span className="anim-float inline-block text-6xl">
              {avatar.emoji}
            </span>
            <p className="mt-3 text-sm opacity-60">
              話しかけてみよう！下のボタンからでもOK
            </p>
          </div>
        )}
        {log.map((item, i) => (
          <LogRow key={i} item={item} avatarEmoji={avatar.emoji} />
        ))}
        {running && log[log.length - 1]?.kind === "user" && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* クイックプロンプト（現在のクエストのお題） */}
      {!running && currentQuest && (
        <div className="flex flex-col gap-2 px-4 pb-2">
          {currentQuest.quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-2xl border-2 border-coral/30 bg-white px-4 py-3 text-left text-sm font-bold text-coral-dark transition active:scale-95"
            >
              💬 {q}
            </button>
          ))}
        </div>
      )}

      {/* 入力欄 */}
      <div className="border-t border-ink/10 bg-white px-4 py-3">
        {progress.energy <= 0 ? (
          <p className="text-center text-sm font-bold opacity-60">
            ⚡ エナジーがたりない！（プロトタイプ:
            <button
              className="text-coral underline"
              onClick={() => saveProgress({ ...progress, energy: MAX_ENERGY })}
            >
              ここをタップでかいふく
            </button>
            ）
          </p>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${spec.name}に話しかける…`}
              disabled={running}
              className="flex-1 rounded-full border-2 border-ink/10 bg-cream px-5 py-3 text-sm font-bold outline-none focus:border-coral disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={running || !input.trim()}
              className="rounded-full bg-coral px-5 py-3 font-extrabold text-white shadow-md transition active:scale-95 disabled:opacity-40"
            >
              送信
            </button>
          </form>
        )}
      </div>

      {/* XP獲得トースト */}
      {xpToast !== null && (
        <div className="anim-xp pointer-events-none fixed inset-x-0 top-24 z-40 text-center">
          <span className="rounded-full bg-sun px-6 py-2 text-lg font-extrabold shadow-lg">
            ✨ +{xpToast} XP
          </span>
        </div>
      )}

      {/* クエストクリアモーダル */}
      {clearedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-8">
          <Confetti />
          <div className="anim-pop w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-3 text-2xl font-extrabold text-coral-dark">
              クエストクリア！
            </h2>
            <p className="mt-2 text-sm opacity-70">
              {clearedQuest.title}をやりとげた！
            </p>
            <p className="mt-3 text-lg font-extrabold text-sun">
              ✨ +{clearedQuest.xp} XP ボーナス
            </p>
            {nextQuest && (
              <p className="mt-2 rounded-2xl bg-lavender/20 px-3 py-2 text-xs font-bold">
                つぎは… {nextQuest.emoji} {nextQuest.title}
              </p>
            )}
            <button
              onClick={() => setClearedQuestId(null)}
              className="mt-5 w-full rounded-full bg-coral py-3 font-extrabold text-white shadow-lg transition active:scale-95"
            >
              {nextQuest ? "つぎのクエストへ" : "つづける"}
            </button>
            <button
              onClick={() => {
                setClearedQuestId(null);
                setShowShare(true);
              }}
              className="mt-2 w-full rounded-full bg-sky/20 py-3 text-sm font-bold text-ink/70 transition active:scale-95"
            >
              📣 ともだちに自慢する
            </button>
          </div>
        </div>
      )}

      {/* シェアモーダル（試遊リンク） */}
      {showShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-8"
          onClick={() => setShowShare(false)}
        >
          <div
            className="anim-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl">{avatar.emoji}</div>
            <h2 className="mt-2 text-xl font-extrabold">
              {spec.name}をシェアしよう
            </h2>
            <p className="mt-2 text-xs opacity-60">
              このリンクを送ると、ともだちが
              <br />
              {spec.name}とおしゃべりできるよ！
            </p>
            <input
              readOnly
              value={shareUrl()}
              onFocus={(e) => e.target.select()}
              className="mt-4 w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2 text-[10px]"
            />
            <button
              onClick={copyShareUrl}
              className="mt-3 w-full rounded-full bg-coral py-3 font-extrabold text-white shadow-lg transition active:scale-95"
            >
              {copied ? "✅ コピーした！" : "リンクをコピー"}
            </button>
            <button
              onClick={() => setShowShare(false)}
              className="mt-2 w-full rounded-full py-2 text-sm font-bold opacity-50"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Confetti() {
  const pieces = ["🎊", "✨", "⭐", "🎉", "💫"];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="anim-confetti absolute text-2xl"
          style={{
            left: `${(i * 7.3) % 100}%`,
            top: "-10px",
            animationDelay: `${(i % 5) * 0.2}s`,
          }}
        >
          {pieces[i % pieces.length]}
        </span>
      ))}
    </div>
  );
}
