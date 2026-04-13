# 新規リポジトリの構成案

新リポジトリは本リポジトリとは別に作成します。想定名は `podcast-automation` (仮)。

## 1. 推奨スタック

| レイヤ | 採用技術 |
|---|---|
| Worker 言語 | Python 3.12 |
| パッケージ管理 | uv (推奨) or Poetry |
| 実行環境 | GitHub Actions (cron + manual dispatch) |
| ストレージ | Cloudflare R2 (S3 互換) |
| 補助 DB | Supabase (pgvector / Auth / Postgres) |
| 管理画面 | Notion (別リポジトリ不要) |
| LLM | Claude API (Anthropic) |
| 音声処理 | Whisper API / pyannote.audio / Auphonic |
| 動画処理 | ffmpeg / moviepy / OpusClip API |
| 画像生成 | Canva API (テンプレ流し込み) |
| 通知 | Slack Incoming Webhook |

## 2. ディレクトリ構成

```
podcast-automation/
├── README.md
├── pyproject.toml
├── uv.lock
├── .env.example
├── .gitignore
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── runbook.md              # オペレーション手順 (事故時含む)
│   ├── brand-style-guide.md    # 本リポジトリからコピー
│   └── adr/                    # アーキテクチャ意思決定記録
│
├── src/
│   └── podcast_automation/
│       ├── __init__.py
│       ├── config.py           # 環境変数・設定ロード
│       ├── logging.py          # 構造化ログ
│       │
│       ├── notion/             # Notion API クライアント
│       │   ├── client.py
│       │   ├── episodes.py
│       │   ├── derivatives.py
│       │   ├── rule_logs.py
│       │   └── schemas.py      # Pydantic モデル
│       │
│       ├── storage/            # R2 クライアント
│       │   ├── r2.py
│       │   └── paths.py        # キー命名規約
│       │
│       ├── ingest/             # 素材取り込み
│       │   ├── detector.py     # 新規エピソード検出
│       │   └── validator.py    # 原本検証
│       │
│       ├── transcribe/         # 文字起こし + 話者分離
│       │   ├── whisper.py
│       │   ├── diarization.py  # pyannote
│       │   └── merge.py        # 話者タイムライン合成
│       │
│       ├── rule_check/         # ルールチェッカ
│       │   ├── engine.py
│       │   ├── loader.py       # Notion ↔ YAML 双方向
│       │   ├── matchers/
│       │   │   ├── forbidden.py
│       │   │   ├── typo.py
│       │   │   ├── trademark.py
│       │   │   ├── pii.py
│       │   │   └── numeric.py
│       │   └── report.py
│       │
│       ├── derivatives/
│       │   ├── long_video/
│       │   │   ├── audio_clean.py
│       │   │   ├── thumbnail.py
│       │   │   └── metadata.py
│       │   ├── shorts/
│       │   │   ├── highlight_extractor.py
│       │   │   ├── vertical_crop.py
│       │   │   ├── subtitle_burn.py
│       │   │   └── hook_generator.py
│       │   ├── sns_images/
│       │   │   ├── key_points.py
│       │   │   ├── canva.py
│       │   │   └── layouts.py
│       │   └── note_article/
│       │       ├── structure.py
│       │       ├── markdown.py
│       │       └── polish.py
│       │
│       ├── publishers/
│       │   ├── youtube.py
│       │   ├── spotify.py      # RSS 生成
│       │   ├── instagram.py
│       │   ├── x.py
│       │   └── note_semi.py    # 半自動 (Markdown を Notion に書き戻し)
│       │
│       ├── analytics/
│       │   ├── youtube.py
│       │   ├── instagram.py
│       │   └── x.py
│       │
│       ├── llm/
│       │   ├── client.py       # Claude API (キャッシュ活用)
│       │   └── prompts/
│       │       ├── highlight.py
│       │       ├── rewrite_note.py
│       │       ├── thumbnail_copy.py
│       │       └── sns_caption.py
│       │
│       ├── notifier/
│       │   └── slack.py
│       │
│       └── cli/
│           ├── run_pipeline.py
│           ├── backfill.py
│           └── debug.py
│
├── config/
│   ├── brand-rules.sample.yaml
│   ├── speakers.sample.yaml
│   └── templates/
│       ├── thumbnail_16x9.json     # Canva テンプレ ID 等
│       ├── sns_1x1.json
│       └── short_9x16.json
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       ├── sample_audio_30s.wav
│       └── sample_transcript.json
│
├── infra/
│   ├── terraform/                  # R2 / Supabase
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── scripts/
│       └── bootstrap_notion.py     # Notion DB 構築支援
│
└── .github/
    └── workflows/
        ├── ci.yml                  # lint + test
        ├── pipeline.yml            # cron 5 分おき
        ├── analytics.yml           # 日次
        └── manual_run.yml          # 手動トリガ (リラン/デバッグ)
```

## 3. 主要なエントリポイント

### パイプライン本体
```bash
# Notion で Status=Uploaded を検出 → 処理を進行
uv run pm run-pipeline

# 特定エピソードだけ再実行
uv run pm run-pipeline --episode-id <notion_page_id> --from rule_check

# ドライラン (LLM/外部投稿を呼ばない)
uv run pm run-pipeline --dry-run
```

### バックフィル
```bash
# 既存のチャンネルから過去の動画を一括で文字起こし + 記事化
uv run pm backfill --source youtube --channel <id>
```

### Analytics
```bash
# 日次で再生数を Notion に書き戻す
uv run pm collect-analytics --date 2026-04-13
```

## 4. 環境変数 (.env.example)

```
# Notion
NOTION_TOKEN=
NOTION_DB_EPISODES=
NOTION_DB_DERIVATIVES=
NOTION_DB_RULE_LOGS=
NOTION_DB_BRAND_RULES=
NOTION_DB_SPEAKERS=
NOTION_DB_ANALYTICS=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=podcast-assets

# LLM / Audio
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AUPHONIC_API_KEY=
HF_TOKEN=              # pyannote 用

# Canva
CANVA_API_KEY=

# Publishers
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
SPOTIFY_RSS_URL=
META_ACCESS_TOKEN=
META_IG_USER_ID=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=

# Notify
SLACK_WEBHOOK_URL=
```

## 5. CI/CD

### `.github/workflows/ci.yml`
- Pull Request で以下を実行
  - ruff (lint / format チェック)
  - pyright (型チェック)
  - pytest (unit + integration)
  - Secrets 流出スキャン (gitleaks)

### `.github/workflows/pipeline.yml`
- cron: 5 分おき
- Notion をポーリングして処理が必要なエピソードを進める
- タイムアウト 50 分 (GitHub Actions の上限 6 時間に余裕あり)
- 失敗時は Slack 通知

### `.github/workflows/analytics.yml`
- cron: 毎日 03:00 JST
- 各プラットフォームの再生数を `Analytics Daily` に書き込み

## 6. コミット・ブランチ運用

- デフォルトブランチ: `main`
- 機能開発: `feat/<topic>` → PR → レビュー → squash merge
- 辞書・設定のみの更新: `config/` 配下限定で直 push 可
- Conventional Commits 準拠 (`feat:` / `fix:` / `chore:` / `docs:`)

## 7. Phase 0 で着手するタスク (新リポジトリ作成直後)

1. リポジトリ作成 + 本構成案のスケルトンを commit
2. `pyproject.toml` + `uv` セットアップ
3. `.github/workflows/ci.yml` 追加
4. `src/podcast_automation/config.py` + `logging.py`
5. `src/podcast_automation/notion/client.py` の実装 (読み書きだけ)
6. `infra/scripts/bootstrap_notion.py` で本ドキュメントの DB 構築を支援
7. `config/brand-rules.sample.yaml` の初期辞書を 200-300 件投入
8. README に最短の「ローカル実行手順」を記載

## 8. 本リポジトリとの関係

本リポジトリ `my-first-repo` の `docs/` には、以下を計画ドキュメントとして残します:

- `docs/podcast-automation-plan.md` (本計画書)
- `docs/notion-setup.md` (Notion DB スキーマ)
- `docs/brand-style-guide.md` (ブランドスタイルガイド)
- `docs/new-repo-structure.md` (本ドキュメント)
- `config/brand-rules.sample.yaml` (ルール辞書テンプレート)

新リポジトリを作成する際に、これらをコピー or サブモジュール参照します。
