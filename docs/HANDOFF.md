# HANDOFF — セッション引き継ぎメモ

> このドキュメントは、新しい Claude Code セッションが本プロジェクトの現状を 1 枚で把握するためのサマリです。
> **最初に読むドキュメント。** 詳細は末尾のリンク先を参照してください。

**最終更新**: 2026-04-13
**対象リポジトリ (実装先)**: `BALDR-SYSTEM/podcast-automation` (新規作成予定)
**計画ドキュメント所在**: `Eindrachen0308/my-first-repo` / branch: `claude/plan-podcast-automation-c5YOS` / `docs/` および `config/`

---

## 1. プロジェクトの目的 (1 行)

収録した音声/動画を起点に、YouTube/Spotify 配信・ショート切り抜き・SNS 図解・note 記事までを半自動で展開する企業オウンドメディア基盤。将来的に Kindle 書籍化まで。

## 2. ヒアリングで確定した要件

| 項目 | 内容 |
|---|---|
| MVP スコープ | 収録 → YouTube/Spotify → ショート → SNS (Instagram/X) → note |
| 将来フェーズ | Kindle 書籍化 |
| 収録形態 | 複数人 (対談/座談会) |
| 音声方針 | 実声のみ (ElevenLabs 等の AI 声は不使用) |
| 承認フロー | ルールベース自動チェック + 例外時のみ人間レビュー |
| 運用規模 | 隔週〜月 1 収録、派生コンテンツ月 10 本程度 |
| 管理画面 | Notion DB (自前ダッシュボードは作らない) |
| ロゴ | あり (要提供) |
| スタイルガイド | 本計画と同時に初版を作成 |
| 配信チャンネル | YouTube / Spotify / Instagram / X / TikTok / note すべて新設 |
| リポジトリ | `BALDR-SYSTEM/podcast-automation` を新規作成 |

## 3. 現在の進捗ステータス

### ✅ 完了
- 全体計画書の作成 (`docs/podcast-automation-plan.md`)
- Notion DB 6 種のスキーマ定義 (`docs/notion-setup.md`)
- ブランドスタイルガイド v0.1 テンプレート (`docs/brand-style-guide.md`)
- 新リポジトリのディレクトリ構成案 (`docs/new-repo-structure.md`)
- ルールチェック辞書テンプレート 20+ 件 (`config/brand-rules.sample.yaml`)

### 🟡 議論中 (このセッションでは未決)

#### 3-1. アーキテクチャ最終確認 (A1-A7)
| # | 項目 | 推奨デフォルト | 代替 |
|---|---|---|---|
| A1 | ストレージ | Cloudflare R2 | AWS S3 |
| A2 | Worker 実行基盤 | GitHub Actions (cron 5 分おき) | Cloud Run |
| A3 | 文字起こし | OpenAI Whisper API | Deepgram |
| A4 | 話者分離 | pyannote.audio (Hugging Face) | AssemblyAI |
| A5 | 切り抜き | ffmpeg + Claude で自作 | OpusClip API |
| A6 | 整音 | Auphonic | iZotope RX |
| A7 | SNS 画像生成 | Canva API テンプレ流し込み | Figma API / 自作 |

→ **新セッションでの最初の確認**: 「この推奨で進めてよいか」をユーザーに確認。

#### 3-2. スタイルガイドの `【要記入】` 欄 (B1-B5)

未着手。以下の 5 ブロックで順に議論する想定:

- **B1 番組の骨格**: コンセプト / キーワード / 避けたい印象 / ターゲット
- **B2 ネーミング**: 番組名 / 略称 / ハッシュタグ / 各 SNS ハンドル
- **B3 ビジュアル**: ロゴ / Primary/Secondary/Accent Color / フォント / サムネテンプレ方向性
- **B4 声のトーン**: 立ち位置 / 踏み込み度 / 出演者敬称
- **B5 統制方針**: 競合言及 / 社員実名 / 数字主張

→ **新セッションでの次のアクション**: B1 から議論を開始する。ブロック 1 を始める前に、以下 4 点をユーザーから聞き出す:
- BALDR-SYSTEM の事業ドメイン・強み領域
- この番組で特にリーチしたい相手 (業種 / 役職)
- 「企業発信で足りていない」と感じるポジション
- タブー視したい方向性

### 🔴 未着手 (事業側の着手が必要なタスク)

1. 新規リポジトリ `BALDR-SYSTEM/podcast-automation` 作成 (← 新セッションは既に作成済み前提)
2. Notion ワークスペースに 6 つの DB 構築 (手順は `docs/notion-setup.md`)
3. YouTube / Spotify / Instagram / X / TikTok / note アカウント開設
4. Cloudflare R2 (or AWS S3) バケット作成
5. BGM ライセンス契約 (Artlist / Epidemic Sound)
6. 各種 API キー取得 (Anthropic / OpenAI / Auphonic / Canva / 各 SNS)
7. ロゴデータ (SVG/PNG) の提供

## 4. 新セッションが最初にやるべきこと

### Step 1: 計画ドキュメントを新リポジトリにコピー
`Eindrachen0308/my-first-repo` の `claude/plan-podcast-automation-c5YOS` ブランチから以下を取り込み、`BALDR-SYSTEM/podcast-automation` の `main` に push:

```
docs/HANDOFF.md                   ← このファイル
docs/podcast-automation-plan.md
docs/notion-setup.md
docs/brand-style-guide.md
docs/new-repo-structure.md
config/brand-rules.sample.yaml
```

### Step 2: ユーザーに状態確認
以下の 2 点を確認する:

1. **アーキテクチャ A1-A7 の推奨デフォルトで進めてよいか** (セクション 3-1)
2. **スタイルガイド B1 の議論を始めてよいか** (セクション 3-2)

### Step 3: 議論の再開
ユーザーの承認が得られたら:

- B1-1 の「番組コンセプト」から議論を開始
- 事業ドメイン・ターゲット・狙うポジション・タブーを聞き出し、具体案 2-3 パターンを提示
- ブロック 1 → 2 → 3 → 4 → 5 の順で詰める
- 各ブロックの決定事項は `docs/brand-style-guide.md` の `【要記入】` 欄を置換する形で書き戻し、commit する

### Step 4: Phase 0 の実装へ
スタイルガイド B1-B3 が決まり次第、並行して Phase 0 の実装に着手可能:

- `pyproject.toml` + `uv` セットアップ
- `src/podcast_automation/` の骨格作成
- `.github/workflows/ci.yml` 追加
- `src/podcast_automation/notion/client.py` 実装 (読み書きのみ)
- `infra/scripts/bootstrap_notion.py` で Notion DB 構築支援
- `config/brand-rules.yaml` を正本化し、200-300 件に拡充

詳細は `docs/new-repo-structure.md` のセクション 7 を参照。

## 5. 意思決定ログ (このセッションで決まったこと)

| 決定 | 理由 |
|---|---|
| MVP に Kindle を含めない | スコープが広すぎて破綻する。Phase 6 として分離 |
| AI 声 (ElevenLabs) 不使用 | 実声の方が企業メディアとして信頼性が高い |
| Notion を管理画面に採用 | 月 10 本規模なら自前 Next.js ダッシュボードは過剰。非エンジニア承認者が触りやすい |
| ルールベース自動チェックを承認コア | 「人間レビューを減らす」が運用成否を決める最大要因。辞書を運用で成長させるループを回す |
| Python ワーカー採用 | ffmpeg / Whisper / pyannote の生態系が豊富 |
| 計画ドキュメントと実装を別リポジトリに | 計画は `my-first-repo`、実装は `BALDR-SYSTEM/podcast-automation` |

## 6. 新セッション起動時の初回プロンプト (コピペ用)

```
このリポジトリ (BALDR-SYSTEM/podcast-automation) にビデオポッドキャスト
自動展開システムを実装します。

計画と設計は別リポジトリ Eindrachen0308/my-first-repo のブランチ
claude/plan-podcast-automation-c5YOS の docs/ と config/ 配下に
すべて書かれています。

まず docs/HANDOFF.md を読んで現状を把握してください。その後、
以下の順で docs/podcast-automation-plan.md、docs/notion-setup.md、
docs/brand-style-guide.md、docs/new-repo-structure.md を確認してください。

次のアクションとして、HANDOFF.md の「4. 新セッションが最初にやるべきこと」
に従って進めてください。まずは Step 1 (ドキュメントのコピー) を実行し、
完了したら Step 2 (ユーザーに状態確認) に進みます。
```

## 7. 関連ドキュメント

| ファイル | 内容 |
|---|---|
| [`podcast-automation-plan.md`](./podcast-automation-plan.md) | 全体計画 (アーキテクチャ / パイプライン / Phase / コスト / リスク) |
| [`notion-setup.md`](./notion-setup.md) | Notion DB 6 種のスキーマと構築手順 |
| [`brand-style-guide.md`](./brand-style-guide.md) | ブランドスタイルガイド v0.1 (`【要記入】` 欄あり) |
| [`new-repo-structure.md`](./new-repo-structure.md) | 新リポジトリのディレクトリ構成・スタック・CI 案 |
| [`../config/brand-rules.sample.yaml`](../config/brand-rules.sample.yaml) | ルールチェック辞書テンプレート (20+ 件) |

---

**このハンドオフは Living Document です。** セッションを跨ぐたびに、現状を反映して更新してください。
