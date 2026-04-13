# ビデオポッドキャスト・コンテンツ自動展開システム 開発計画 v1.0

本ドキュメントは、収録した音声/動画を起点に、YouTube/Spotify 配信・ショート切り抜き・SNS 図解投稿・note 記事までを半自動で運用するシステムの開発計画書です。将来的に Kindle 書籍化までを見据えます。

## 1. ゴール

- **目的**: 企業オウンドメディアの情報発信を、品質を保ちながら一本の収録から多チャネルに爆発的に展開する
- **狙い**: 承認フローの重さを「人間判断の自動化 (ルールベース)」で解消し、制作量と品質の両立を成立させる
- **非ゴール**: 高品質な広告クリエイティブ制作 / リアルタイム配信 / AI 声による出演者代替

## 2. 確定要件

| 項目 | 決定内容 |
|---|---|
| MVP スコープ | 収録 → YouTube/Spotify → ショート → SNS(Instagram/X) → note |
| 将来フェーズ | Kindle 書籍化 |
| 収録形態 | 複数人 (対談/座談会形式) |
| 音声処理 | 実声のみ (ElevenLabs 等の AI 声は使わない) |
| 承認フロー | ルールベース自動チェック + 例外時のみ人間レビュー |
| 運用規模目標 | 隔週〜月 1 収録、派生コンテンツ 月 10 本程度 |
| ダッシュボード | Notion DB を管理画面として使用 |
| ロゴ | あり (要提供) |
| スタイルガイド | 本計画と同時に初版を作成 |
| 配信チャンネル | すべて新設 (YouTube / Spotify / Instagram / X / note) |
| リポジトリ | 新規リポジトリ (本リポジトリとは別) |

## 3. アーキテクチャ全体像

```
┌──────────────────────────────────────────────────────┐
│                    Notion (管理画面)                    │
│  Episodes / Derivatives / Rule Logs / Speakers / Rules │
└──────────────────────────────────────────────────────┘
                ↑ API ポーリング
                ↓ ステータス更新 / プレビュー URL 返却
┌──────────────────────────────────────────────────────┐
│          Worker (Python) — GitHub Actions / Cloud Run │
│  ├ Ingest           : 素材取り込み                      │
│  ├ Transcribe       : Whisper / Deepgram (話者分離)     │
│  ├ RuleCheck        : YAML 辞書ベースチェッカ           │
│  ├ Derivatives                                          │
│  │   ├ LongVideo    : 整音 + サムネ生成                 │
│  │   ├ Shorts       : LLM ハイライト抽出 + ffmpeg 縦型  │
│  │   ├ SNSImages    : Canva API + テンプレ流し込み      │
│  │   └ NoteArticle  : Claude API で再構成 → Markdown    │
│  └ Publishers                                           │
│      ├ YouTube Data v3                                  │
│      ├ Spotify for Podcasters (RSS)                     │
│      ├ Meta Graph (Instagram)                           │
│      ├ X API                                            │
│      └ note (API 無し → 半自動)                         │
└──────────────────────────────────────────────────────┘
                ↕
┌──────────────────────────────────────────────────────┐
│  Cloudflare R2 (原本・生成物保管) / Supabase (補助 DB)  │
└──────────────────────────────────────────────────────┘
```

### 選定理由

- **Notion をダッシュボードに**: 最速立ち上げ。非エンジニアの承認者が触りやすい
- **Python ワーカー**: ffmpeg / Whisper / 各種メディア処理の生態系が圧倒的に整っている
- **Cloudflare R2**: S3 互換で帯域料金が無料。動画を多く扱うため
- **GitHub Actions or Cloud Run**: 月 10 本規模なら常駐は不要。ジョブベースで十分

## 4. 処理パイプライン

```
[収録終了]
   ↓ (手動) R2 にアップロード + Notion に新規 Episode レコード作成
[Worker: Ingest] 原本検証 / メタ抽出 / 長さ測定
   ↓
[Worker: Transcribe] Whisper で文字起こし + pyannote で話者分離
   ↓ (Transcript URL を Notion に書き戻し)
[Worker: RuleCheck] YAML 辞書でスキャン
   │
   ├─ All Pass → 次工程へ
   └─ Block/Warn あり → Notion の承認キューに積み、通知
      ↓ (Slack 通知 + Notion でレビュー完了マーク)
      次工程へ
   ↓
[Worker: Derivatives] 並列実行
   ├ LongVideo    : 整音 (Auphonic) + サムネ (Claude → Canva)
   ├ Shorts       : LLM でハイライト箇所 (30-60s) を N 個抽出
   │                → ffmpeg で 9:16 クロップ + 字幕焼き込み
   ├ SNSImages    : 要点 3-5 枚 → Canva テンプレに流し込み
   └ NoteArticle  : 章立て構造化 → Markdown 化 + 見出し生成
   ↓
[Worker: FinalCheck] タイトル/サムネ/ハッシュタグの最終ルールチェック
   ↓
[Notion: 一括プレビュー画面] 全成果物を 1 画面で確認
   ↓ (ステータスを「Approved」に変更)
[Worker: Publisher] スケジュール投稿
   ↓
[Worker: Analytics] 定期実行で再生数・反応を取得 → Notion に書き戻し
```

## 5. ルールベース自動チェック設計

**ここが承認工数削減のコア**。詳細な辞書テンプレートは `config/brand-rules.sample.yaml` を参照。

| カテゴリ | 内容 | 検出時の挙動 |
|---|---|---|
| 禁則語 | 競合名 / 未発表プロダクト / 過去トラブル案件 | Block (強制停止) |
| 表記ゆれ | 生成 AI / Generative AI など | 自動置換 |
| 数字・統計 | 「X% 成長」「N 社導入」 | Warn + 根拠 URL 必須フラグ |
| 商標記号 | ®, ™ | 自動付与/削除 |
| 人物言及 | 社員実名 | 自動マスク or 肩書き置換 |
| 機密パターン | 未公開財務 / 個人情報の正規表現 | Block + 緊急通知 |

### 運用ループ

1. 初期は網を広めに張り、False Positive を許容
2. 人間レビューで「これは OK」と判断された場合、**その判断をルールに追加** (辞書更新)
3. 2 週間ごとに辞書を見直し、通過率を計測
4. 目標: 3 ヶ月後に人間レビュー発生率 < 20%

## 6. フェーズ計画

| Phase | 内容 | 主要成果物 | 目安 |
|---|---|---|---|
| **P0** | 基盤準備 | 新規リポジトリ / Notion DB / R2 バケット / ブランドスタイルガイド v1 / 出演者プロフィール | 2 週 |
| **P1** | 取り込み+チェック | Ingest / 話者分離付き Transcribe / RuleCheck エンジン / Notion 連携 | 3 週 |
| **P2** | 本編配信 | 整音 / サムネ自動生成 / YouTube API / Spotify RSS | 3 週 |
| **P3** | ショート切り抜き | ハイライト抽出 / 縦型変換 / 字幕焼き / Shorts・Reels・TikTok 投稿 | 3-4 週 |
| **P4** | SNS 図解 | 要点抽出 / Canva API / Instagram・X 予約投稿 | 2-3 週 |
| **P5** | note 記事化 | Markdown 生成 / note 半自動投稿 / 効果測定集計 | 2 週 |
| **P6** | (将来) Kindle 化 | 複数回集約 / 章立て / KDP 形式 / 表紙生成 | - |

P0-P2 完成時点で「本編配信だけは回る」状態になります。ここを最速で通すのが推奨。

## 7. 運用コスト試算 (月 10 本想定)

| 項目 | 月額目安 (USD) |
|---|---|
| Claude API (要約/ハイライト抽出/記事化/図解構成) | $50-150 |
| Whisper API or Deepgram (話者分離含む) | $20-60 |
| OpusClip or Descript (切り抜き補助) | $30-100 |
| Auphonic (整音) | $20 |
| Canva Pro (テンプレ管理) | $15 |
| Cloudflare R2 (保管+帯域) | $5-15 |
| Supabase (DB/Auth) | $0-25 |
| GitHub Actions (CI + Worker) | $0-20 |
| **合計** | **$140-400 / 月 (約 2-6 万円)** |

初月は実測を優先し、コストアラートを R2/API 各所に設定します。

## 8. リスクと対策

| リスク | 対策 |
|---|---|
| 複数人収録の話者分離精度 | 事前に出演者の声サンプルを登録 (pyannote の話者埋め込みを固定) |
| ルール辞書の初期精度不足 | P0 で業界 NG 語 200-300 件を事前投入 + 運用で増やす |
| note の API がない | 初期は Markdown を Notion に出力 → 人間が note にコピペ。後期で Puppeteer 自動投稿を検討 |
| YouTube API の認証 (OAuth 承認) | 法人チャンネル作成後に OAuth をワーカーに紐付け。リフレッシュトークン管理 |
| 著作権 BGM | 著作権フリー BGM カタログを契約 (Artlist/Epidemic Sound 等) |
| ログ・原本保管の肥大化 | R2 にライフサイクルポリシー設定 (原本は 90 日で Cold Storage へ) |

## 9. 判断が必要な残課題 (Phase 0 着手時までに)

1. **BGM 調達方法** — Artlist or Epidemic Sound or 社内作曲
2. **YouTube チャンネル名・note アカウント名・SNS ハンドル** の確定
3. **サムネテンプレートのデザイン依頼** — Canva 上で 3 パターン程度
4. **R2 or AWS S3** — Cloudflare が未契約なら最初は AWS でも OK
5. **Worker の実行環境** — GitHub Actions か Cloud Run か (月 10 本なら前者で十分)

## 10. 付随ドキュメント

- [`notion-setup.md`](./notion-setup.md) — Notion DB スキーマ定義
- [`brand-style-guide.md`](./brand-style-guide.md) — ブランドスタイルガイド v0.1
- [`new-repo-structure.md`](./new-repo-structure.md) — 新規リポジトリのディレクトリ構成案
- [`../config/brand-rules.sample.yaml`](../config/brand-rules.sample.yaml) — ルールチェック辞書テンプレート

---

**次のアクション**: 本計画への承認後、Phase 0 に着手します。
Phase 0 の最初のタスクは「新規リポジトリの作成」「Notion DB の構築」「ロゴ・BGM 調達」です。
