# CLAUDE.md - プロジェクトコンテキスト

## プロジェクト概要
HERP風の採用管理ダッシュボード（Next.js App Router）

## 技術スタック
- Next.js 16 (App Router) / React 19 / TypeScript 5.9
- Tailwind CSS 4 / Recharts 3.7
- クライアントサイドストア（src/lib/store.ts）
- UUID 13

## ディレクトリ構造
```
recruitment-dashboard/src/
├── app/           # ページ & APIルート
│   ├── api/       # candidates, jobs, dashboard, slack, templates
│   ├── candidates/, jobs/, dashboard/, settings/, templates/
│   ├── layout.tsx # ルートレイアウト（ナビゲーション）
│   └── page.tsx   # ホームリダイレクト
├── components/    # Sidebar, StageBadge, RatingStars
├── lib/           # store.ts, metrics.ts, validation.ts
└── types/         # index.ts（型定義）
```

## ドメインモデル
- **選考ステージ**: 応募→書類選考→一次面接→二次面接→最終面接→内定→入社（+不合格/辞退）
- **候補者（Candidate）**: 名前, メール, 電話, ステージ, 評価, タグ, ステータス履歴
- **求人（Job）**: タイトル, 部署, 勤務地, 雇用形態, 給与レンジ, ステータス
- **テンプレート（MessageTemplate）**: CRUD + 自動バージョン管理
- **Slack連携**: Webhook通知

## 開発コマンド
```bash
cd recruitment-dashboard
npm install
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run lint     # リント
```

## コーディング規約
- パスエイリアス: `@/*` → `./src/*`
- API: Next.js Route Handlers（app/api/）
- バリデーション: src/lib/validation.ts を使用
- 日本語でコミットメッセージを書く（例: feat: 〇〇機能を追加）
