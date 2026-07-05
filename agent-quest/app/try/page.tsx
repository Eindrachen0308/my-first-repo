"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AVATARS, TRY_MAX_RUNS, TRY_PROMPTS } from "@/lib/presets";
import { decodeSpec } from "@/lib/share";
import type { AgentSpec, ChatMessage, RunEvent } from "@/lib/types";
import { LogRow, TypingDots, type LogItem } from "@/components/RunLog";

// 試遊リンク: シェアされたエージェントと誰でもおしゃべりできるページ。
// URLにAgentSpecが丸ごと入っているのでDB不要（Phase 1で公開ID方式に置き換え）。
export default function TryPage() {
  return (
    <Suspense fallback={null}>
      <TryInner />
    </Suspense>
  );
}

function TryInner() {
  const params = useSearchParams();
  const [spec, setSpec] = useState<AgentSpec | null | "invalid">(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [runsLeft, setRunsLeft] = useState(TRY_MAX_RUNS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = params.get("s");
    setSpec(s ? (decodeSpec(s) ?? "invalid") : "invalid");
  }, [params]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  if (spec === null) return null;
  if (spec === "invalid") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="text-6xl">🥚💔</span>
        <p className="font-bold">リンクがこわれているみたい…</p>
        <Link href="/" className="font-extrabold text-coral underline">
          じぶんのAIをそだてる →
        </Link>
      </main>
    );
  }

  const avatar = AVATARS.find((a) => a.id === spec.avatarId) ?? AVATARS[0];

  const send = async (text: string) => {
    if (running || !text.trim() || runsLeft <= 0) return;
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
            setRunsLeft((r) => r - 1);
          }
        }
      }
    } catch {
      setLog((l) => [
        ...l,
        { kind: "thought", text: "⚠️ つうしんエラー。もういちど試してね" },
      ]);
    } finally {
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
      <header className="border-b border-ink/10 bg-white px-4 py-3 text-center">
        <div className="text-[10px] font-bold text-lavender">
          📣 ともだちのAIがあそびにきたよ！
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-3xl">{avatar.emoji}</span>
          <span className="text-lg font-extrabold">{spec.name}</span>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {log.length === 0 && (
          <div className="pt-8 text-center">
            <span className="anim-float inline-block text-6xl">
              {avatar.emoji}
            </span>
            <p className="mt-3 text-sm opacity-60">
              {spec.name}に話しかけてみよう！（あと{runsLeft}回おためしできるよ）
            </p>
          </div>
        )}
        {log.map((item, i) => (
          <LogRow key={i} item={item} avatarEmoji={avatar.emoji} />
        ))}
        {running && log[log.length - 1]?.kind === "user" && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {!running && runsLeft > 0 && log.length === 0 && (
        <div className="flex flex-col gap-2 px-4 pb-2">
          {TRY_PROMPTS.map((q) => (
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

      <div className="border-t border-ink/10 bg-white px-4 py-3">
        {runsLeft <= 0 ? (
          <div className="anim-pop rounded-2xl bg-sun/20 p-4 text-center">
            <p className="text-sm font-extrabold">
              おためしはここまで！たのしかった？
            </p>
            <Link
              href="/"
              className="mt-3 inline-block rounded-full bg-coral px-8 py-3 font-extrabold text-white shadow-lg transition active:scale-95"
            >
              🥚 きみだけのAIをそだてる
            </Link>
          </div>
        ) : (
          <>
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
                placeholder={`${spec.name}に話しかける…（あと${runsLeft}回）`}
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
            <Link
              href="/"
              className="mt-2 block text-center text-xs font-bold text-coral underline"
            >
              じぶんのAIもそだててみる →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
