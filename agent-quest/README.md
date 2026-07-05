# そだてAI プロトタイプ (Phase 0)

「そだてよう、じぶんのAI。」— ゲーム感覚でAIエージェントを作れるWebアプリのプロトタイプ。

設計書: [`../docs/ai-agent-gamification-design.md`](../docs/ai-agent-gamification-design.md)

## このプロトタイプの範囲

**「5分でFirst Agent Moment」の一本道を検証する**（設計書 Phase 0）:

1. たまご選択 → 性格 → スキル装備 → 命名（クラフトUI）
2. 誕生演出
3. クエスト（🎒旅行プランナー → 🍳献立コンシェルジュ の順にクリア）
4. 実行の戦闘ログ風演出（💭思考 → 🔍スキル発動 → ✨結果 → 返答ストリーミング）
5. XP獲得・クエストクリア演出
6. 試遊リンクのシェア（`/try?s=...` — 受け取った人がそのエージェントとおしゃべりできる。おためし3回→「じぶんも作る」導線）
7. 改造こうぼう（`/workshop` — 「ツンデレにして」等の自然言語指示 → スペック差分をdiff表示 → はんえい。Claude Code的な「指示すると変わる」体験）
8. せっけいず（`/blueprint` — エージェントの中身を構造化表示。「コードのなかみをのぞく」でJSONを見られる。成長パス ステージ5「よむ」）
9. ルールカード（`/rules` — WHEN×THENのカードを組んで行動ルールを最大3つセット。成長パス ステージ4「くむ」）
10. 改造フック（返答の下の「🤔思ってたのとちがう？」→ 改造こうぼう/ルールカードへ。「ためす→直す」ループ）

エナジー・XP・レベルはローカル（localStorage）のみ。DB・認証・公開機能は未実装（Phase 1スコープ）。

## 起動方法

```bash
cd agent-quest
npm install

# 実際のClaude APIに接続する場合（推奨・Web検索ツール使用）
export ANTHROPIC_API_KEY=sk-ant-...

npm run dev
# → http://localhost:3000 をスマホサイズのビューで開く
```

`ANTHROPIC_API_KEY` が無い場合は自動的に**モック実行**になり、演出の確認だけならAPIキー不要で動きます（APIエラー時もモックにフォールバックします）。

環境変数 `AGENT_MODEL` でモデルを差し替え可能（デフォルト: `claude-sonnet-5`）。

## デプロイ（Vercel推奨）

1. https://vercel.com にGitHubアカウントでログインし、「Add New → Project」でこのリポジトリ（`my-first-repo`）をインポート
2. **Root Directory を `agent-quest` に設定**（Edit から選択。モノレポ内サブディレクトリのため必須）
3. Framework Preset は Next.js が自動検出される（ビルド設定の変更は不要）
4. Environment Variables に以下を設定:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`（https://console.anthropic.com で発行。未設定でもモック実行で動く）
   - `AGENT_MODEL` = 任意（省略可）
5. Deploy を押すと1〜2分で `https://<プロジェクト名>.vercel.app` が発行される

以降は対象ブランチにpushするたびに自動で再デプロイされる（Production Branch はVercelの Settings → Git で変更可能）。

注意（プロトタイプの制約）:
- エナジー/XPはブラウザのlocalStorage保存のため、端末ごとに独立
- 公開URLにするとAPIキーの利用が第三者に開かれるため、**お試し共有の間だけ** Vercel の Deployment Protection（パスワード/Vercel認証)をかけるか、エナジー上限がハードリミットである点を理解した上で共有範囲を限定すること

## 構成

```
app/
  page.tsx          タイトル画面
  craft/page.tsx    クラフト（ウィザード）＋誕生演出
  play/page.tsx     クエスト実行・チャット・観戦ログ演出・シェア
  try/page.tsx      試遊リンク（シェアされたエージェントと誰でも会話）
  workshop/page.tsx 改造こうぼう（自然言語指示→スペックdiff→反映）
  blueprint/page.tsx せっけいず（スペックの構造化表示＋JSONビュー）
  rules/page.tsx    ルールカード（WHEN×THENの組み合わせビルダー）
  api/run/route.ts  実行API（NDJSONストリーミング / 実API+モックフォールバック）
  api/craft/route.ts 改造API（指示→スペック差分。ツール強制呼び出し / モックフォールバック）
components/
  RunLog.tsx        戦闘ログ風の実行イベント表示（play/tryで共用）
lib/
  types.ts          AgentSpec・RunEvent（設計書のプロトコル原型）
  presets.ts        アバター・性格・スキル・クエストのマスタデータ
  prompt.ts         AgentSpec → システムプロンプトのコンパイル
  share.ts          試遊リンクのエンコード/デコード
```
