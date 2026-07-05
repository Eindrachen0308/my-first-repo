import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "そだてAI - そだてよう、じぶんのAI。",
  description:
    "ゲームであそぶ感覚で、じぶんだけのAIエージェントをつくって育てるアプリ（プロトタイプ）",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        {/* スマホ縦画面ファースト: PCでは中央カラムに固定 */}
        <div className="mx-auto min-h-dvh max-w-md bg-cream shadow-xl">
          {children}
        </div>
      </body>
    </html>
  );
}
