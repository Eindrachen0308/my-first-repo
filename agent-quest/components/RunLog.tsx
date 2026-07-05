"use client";

// チャットログに表示する要素（メッセージ＋戦闘ログ風の実行イベント）
// /play と /try（試遊リンク）で共用する。
export type LogItem =
  | { kind: "user"; text: string }
  | { kind: "agent"; text: string; streaming: boolean }
  | { kind: "thought"; text: string }
  | { kind: "skill"; label: string; query?: string }
  | { kind: "skill_result"; label: string };

export function LogRow({
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

export function TypingDots() {
  return (
    <div className="flex gap-1 pl-12">
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          className="anim-dot h-2 w-2 rounded-full bg-ink/40"
          style={{ animationDelay: `${d * 0.15}s` }}
        />
      ))}
    </div>
  );
}
