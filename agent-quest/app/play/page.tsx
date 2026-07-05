"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVATARS,
  MAX_ENERGY,
  QUICK_PROMPTS,
  TUTORIAL_QUEST,
  XP_PER_LEVEL,
} from "@/lib/presets";
import type { AgentSpec, ChatMessage, RunEvent } from "@/lib/types";

// チャットログに表示する要素（メッセージ＋戦闘ログ風の実行イベント）
type LogItem =
  | { kind: "user"; text: string }
  | { kind: "agent"; text: string; streaming: boolean }
  | { kind: "thought"; text: string }
  | { kind: "skill"; label: string; query?: string }
  | { kind: "skill_result"; label: string };

type Progress = { xp: number; energy: number; questDone: boolean };

export default function PlayPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<AgentSpec | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    xp: 0,
    energy: MAX_ENERGY,
    questDone: false,
  });
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [showClear, setShowClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("agent-quest:spec");
    if (!raw) {
      router.replace("/craft");
      return;
    }
    setSpec(JSON.parse(raw));
    const p = localStorage.getItem("agent-quest:progress");
    if (p) setProgress(JSON.parse(p));
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

  const send = async (text: string) => {
    if (running || !text.trim() || progress.energy <= 0) return;
    setRunning(true);
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setLog((l) => [...l, { kind: "user", text: userMsg.content }]);

    let agentText = "";
    let gotDone = false;
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, messages: newHistory }),
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
            gotDone = true;
            const newXp = progress.xp + ev.xp;
            const firstClear = !progress.questDone;
            saveProgress({
              xp: newXp + (firstClear ? TUTORIAL_QUEST.xp : 0),
              energy: progress.energy - 1,
              questDone: true,
            });
            setXpToast(ev.xp + (firstClear ? TUTORIAL_QUEST.xp : 0));
            setTimeout(() => setXpToast(null), 2000);
            if (firstClear) setTimeout(() => setShowClear(true), 800);
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
      if (!gotDone && !agentText) {
        // 応答が空のまま終わった場合もエナジーは消費しない
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
        <div className="text-right">
          <div className="text-sm font-extrabold">
            ⚡ {progress.energy}
            <span className="opacity-40">/{MAX_ENERGY}</span>
          </div>
          <div className="text-[10px] opacity-40">エナジー</div>
        </div>
      </header>

      {/* クエストバナー */}
      {!progress.questDone && (
        <div className="mx-4 mt-3 rounded-2xl bg-lavender/25 px-4 py-3">
          <div className="text-[10px] font-bold text-lavender">
            ⭐ {TUTORIAL_QUEST.title}
          </div>
          <div className="text-sm font-extrabold">{TUTORIAL_QUEST.goal}</div>
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
        {running && log[log.length - 1]?.kind === "user" && (
          <div className="flex gap-1 pl-12">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="anim-dot h-2 w-2 rounded-full bg-ink/40"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* クイックプロンプト */}
      {!running && log.length === 0 && (
        <div className="flex flex-col gap-2 px-4 pb-2">
          {QUICK_PROMPTS.map((q) => (
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
            ⚡ エナジーがたりない！（プロトタイプ: リロードはせず、
            <button
              className="text-coral underline"
              onClick={() =>
                saveProgress({ ...progress, energy: MAX_ENERGY })
              }
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
      {showClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-8">
          <Confetti />
          <div className="anim-pop w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-3 text-2xl font-extrabold text-coral-dark">
              クエストクリア！
            </h2>
            <p className="mt-2 text-sm opacity-70">
              {spec.name}が、はじめてのおしごとをやりとげた！
            </p>
            <p className="mt-3 text-lg font-extrabold text-sun">
              ✨ +{TUTORIAL_QUEST.xp} XP ボーナス
            </p>
            <button
              onClick={() => setShowClear(false)}
              className="mt-6 w-full rounded-full bg-coral py-3 font-extrabold text-white shadow-lg transition active:scale-95"
            >
              つづける
            </button>
            <button
              onClick={() => setShowClear(false)}
              className="mt-2 w-full rounded-full bg-sky/20 py-3 text-sm font-bold text-ink/70 transition active:scale-95"
            >
              📣 シェアする（準備中）
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function LogRow({
  item,
  avatarEmoji,
}: {
  item: LogItem;
  avatarEmoji: string;
}) {
  switch (item.kind) {
    case "user":
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-3xl rounded-br-md bg-coral px-4 py-3 text-sm font-bold text-white">
            {item.text}
          </div>
        </div>
      );
    case "agent":
      return (
        <div className="flex items-end gap-2">
          <span className="text-2xl">{avatarEmoji}</span>
          <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-bl-md bg-white px-4 py-3 text-sm font-bold shadow-sm">
            {item.text}
            {item.streaming && <span className="opacity-40">▍</span>}
          </div>
        </div>
      );
    case "thought":
      return (
        <div className="anim-pop pl-10 text-xs italic opacity-50">
          💭 {item.text}
        </div>
      );
    case "skill":
      return (
        <div className="anim-pop mx-6">
          <div className="anim-shine rounded-2xl border-2 border-mint bg-mint/10 px-4 py-2 text-center">
            <span className="text-sm font-extrabold text-mint">
              🔍 {item.label}
            </span>
            {item.query && (
              <span className="block text-xs opacity-60">「{item.query}」</span>
            )}
          </div>
        </div>
      );
    case "skill_result":
      return (
        <div className="anim-pop text-center text-xs font-bold text-mint">
          ✨ {item.label}
        </div>
      );
  }
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
