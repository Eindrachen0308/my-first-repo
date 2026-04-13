# Notion DB セットアップ

Notion をパイプラインの管理画面として使用します。本ドキュメントは DB スキーマと構築手順を定義します。

## 1. 構築する DB 一覧

| DB 名 | 役割 |
|---|---|
| `Episodes` | 収録回マスタ。パイプラインの起点 |
| `Derivatives` | 派生コンテンツ (本編/ショート/SNS 画像/note 記事) |
| `Rule Check Logs` | 自動チェック結果の履歴 |
| `Brand Rules` | 禁則語・表記ゆれ辞書 (運用で更新) |
| `Speakers` | 出演者マスタ (声サンプル・肩書き) |
| `Analytics Daily` | 配信後の再生数・反応の日次スナップショット |

## 2. DB スキーマ

### 2.1 `Episodes`

| プロパティ | 型 | 説明 |
|---|---|---|
| Title | Title | 収録回タイトル |
| Episode Number | Number | 通し番号 |
| Recording Date | Date | 収録日 |
| Hosts | Relation → Speakers | 出演者 (複数) |
| Status | Select | `Uploaded` / `Transcribing` / `Rule Checking` / `Waiting Review` / `Approved` / `Publishing` / `Published` / `Archived` |
| Theme | Rich Text | 収録テーマ |
| Show Notes | Rich Text | 番組説明文 |
| Raw Video URL | URL | R2 の原本動画パス |
| Raw Audio URL | URL | R2 の原本音声パス |
| Transcript URL | URL | 文字起こし結果 (R2) |
| Duration (sec) | Number | 収録秒数 |
| Publish Plan Date | Date | 配信予定日 |
| Created | Created time | - |
| Last Edited | Last edited time | - |

### 2.2 `Derivatives`

| プロパティ | 型 | 説明 |
|---|---|---|
| Title | Title | 派生コンテンツタイトル |
| Type | Select | `Long Video` / `Short` / `SNS Image` / `Note Article` |
| Parent Episode | Relation → Episodes | 親エピソード |
| Platform | Multi-select | `YouTube` / `Spotify` / `TikTok` / `YouTube Shorts` / `Instagram Reels` / `Instagram Feed` / `X` / `note` |
| Status | Select | `Generated` / `Rule Check` / `Waiting Review` / `Approved` / `Scheduled` / `Published` / `Rejected` |
| Content URL | URL | 生成物 (R2) |
| Thumbnail URL | URL | サムネ |
| Caption | Rich Text | 投稿文 |
| Hashtags | Multi-select | ハッシュタグ |
| Scheduled Post Time | Date | 予約投稿時刻 |
| Published URL | URL | 公開後 URL |
| Rule Check Summary | Rich Text | 自動生成されるチェック要約 |
| Views | Number | Analytics から書き戻し |
| Likes | Number | 同上 |

### 2.3 `Rule Check Logs`

| プロパティ | 型 | 説明 |
|---|---|---|
| Name | Title | 自動生成ID |
| Target | Relation → Derivatives or Episodes | - |
| Category | Select | `禁則語` / `表記ゆれ` / `数字・統計` / `商標` / `人物言及` / `機密` |
| Severity | Select | `Block` / `Warn` / `Info` |
| Matched Rule | Relation → Brand Rules | - |
| Detected Term | Rich Text | 検出されたトークン |
| Context | Rich Text | 前後 40 字 |
| Resolution | Select | `Auto Fixed` / `Human Reviewed OK` / `Human Reviewed NG` / `Ignored` |
| Created | Created time | - |

### 2.4 `Brand Rules`

| プロパティ | 型 | 説明 |
|---|---|---|
| Rule Name | Title | 識別子 |
| Category | Select | 上記 Rule Check Logs と同じ |
| Pattern | Rich Text | 正規表現または完全一致文字列 |
| Replacement | Rich Text | 自動置換先 (該当時のみ) |
| Severity | Select | `Block` / `Warn` / `Info` |
| Active | Checkbox | 有効/無効 |
| Note | Rich Text | 追加理由・備考 |

> **運用ルール**: 人間レビューで NG 判定が出たら、その場で Brand Rules に 1 件追加する。これが辞書強化ループの起点。

### 2.5 `Speakers`

| プロパティ | 型 | 説明 |
|---|---|---|
| Name | Title | 実名 |
| Display Name | Rich Text | 番組内表記 (「○○ CEO」等) |
| Bio | Rich Text | プロフィール文 |
| Voice Sample URL | URL | pyannote 用の声サンプル (30 秒以上推奨) |
| Speaker Embedding | Rich Text | 話者埋め込みベクトル (Worker が書き込む) |
| Social Links | URL / Rich Text | - |
| Active | Checkbox | 現役かどうか |

### 2.6 `Analytics Daily`

| プロパティ | 型 | 説明 |
|---|---|---|
| Snapshot Date | Date | スナップショット日 |
| Target | Relation → Derivatives | - |
| Views | Number | - |
| Likes | Number | - |
| Comments | Number | - |
| Shares | Number | - |
| Retention % | Number | 動画のみ |

## 3. 推奨ビュー

### `Episodes` のビュー
- **Inbox** — Status が `Uploaded` / `Transcribing` / `Rule Checking` のもの (Worker 側の進行中)
- **Waiting Review** — Status が `Waiting Review` のもの (人間タスク)
- **Published** — 公開済み一覧
- **Calendar** — Publish Plan Date ベースのカレンダー

### `Derivatives` のビュー
- **By Type** — Type でグルーピング
- **Waiting Review** — Status = `Waiting Review`
- **Scheduled** — Scheduled Post Time ベースのカレンダー
- **Top Performers** — Views 降順 (月次で振り返り)

### `Rule Check Logs` のビュー
- **Blocks Only** — Severity = `Block` (緊急対応)
- **By Category** — カテゴリ別集計 (辞書改善の判断に)

## 4. 構築手順 (Phase 0)

1. Notion にチーム用ワークスペースを作成 (or 既存利用)
2. 本ドキュメントのスキーマに従い 6 つの DB を作成
3. Notion インテグレーションを作成し、Worker 用のトークンを発行
4. 6 つの DB にインテグレーションを「接続」
5. 各 DB の ID を新リポジトリの `.env` に登録
   ```
   NOTION_TOKEN=secret_xxx
   NOTION_DB_EPISODES=xxx
   NOTION_DB_DERIVATIVES=xxx
   NOTION_DB_RULE_LOGS=xxx
   NOTION_DB_BRAND_RULES=xxx
   NOTION_DB_SPEAKERS=xxx
   NOTION_DB_ANALYTICS=xxx
   ```
6. 初期データとして `config/brand-rules.sample.yaml` を `Brand Rules` にインポート
7. `Speakers` に出演者を登録し、声サンプルをアップロード

## 5. Worker ↔ Notion の連携方式

### 方式: ポーリング (推奨・MVP)
- GitHub Actions の cron で 5 分おきに `Episodes.Status = "Uploaded"` をスキャン
- 処理終了ごとに Status を更新し、進捗を Notion に反映
- 長所: シンプル・デバッグしやすい。月 10 本規模なら十分
- 短所: 最大 5 分の遅延 (問題なし)

### 方式: Notion Webhook (将来)
- Notion の Webhook (2024 年以降に強化) でイベント駆動に
- ポーリングより即時性が高いが、エラー時のリトライ設計が複雑

## 6. 権限設計

| ロール | 権限 |
|---|---|
| 管理者 | 全 DB 編集 + Brand Rules 編集 |
| 承認者 | Episodes / Derivatives の Status 変更のみ |
| 閲覧者 | Analytics 閲覧のみ |

Brand Rules は「誰でも追加できるが削除は管理者のみ」にすると辞書が成長しやすい。

## 7. Notion だけでは足りない部分

Notion は UI として優秀だが、以下は外部に持たせる:
- **大容量ファイル** (動画/音声): Cloudflare R2 に置き、URL を Notion に保存
- **ベクトル検索・類似過去発言検索**: Supabase pgvector
- **構造化ログ**: JSONL で R2 / BigQuery へ (障害調査用)
