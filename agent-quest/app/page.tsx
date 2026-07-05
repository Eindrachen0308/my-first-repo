import Link from "next/link";

export default function TitlePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-8 text-center">
      <div className="anim-float text-8xl" aria-hidden>
        🥚
      </div>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-coral-dark">
          そだてAI
        </h1>
        <p className="mt-3 text-lg font-bold">そだてよう、じぶんのAI。</p>
        <p className="mt-2 text-sm opacity-70">
          ゲームであそぶ感覚で、じぶんだけの
          <br />
          AIエージェントが作れるよ
        </p>
      </div>
      <Link
        href="/craft"
        className="anim-pop rounded-full bg-coral px-12 py-4 text-xl font-extrabold text-white shadow-lg shadow-coral/40 transition active:scale-95"
      >
        はじめる
      </Link>
      <p className="text-xs opacity-50">プロトタイプ v0.1</p>
    </main>
  );
}
