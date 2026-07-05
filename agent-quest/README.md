# Agent Quest プロトタイプ (Phase 0)

「そだてよう、じぶんのAI。」— ゲーム感覚でAIエージェントを作れるWebアプリのプロトタイプ。

設計書: [`../docs/ai-agent-gamification-design.md`](../docs/ai-agent-gamification-design.md)

## このプロトタイプの範囲

**「5分でFirst Agent Moment」の一本道を検証する**（設計書 Phase 0）:

1. たまご選択 → 性格 → スキル装備 → 命名（クラフトUI）
2. 誕生演出
3. はじめてのクエスト「週末のおでかけプランを聞いてみよう」
4. 実行の戦闘ログ風演出（💭思考 → 🔍スキル発動 → ✨結果 → 返答ストリーミング）
5. XP獲得・クエストクリア演出

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

## 構成

```
app/
  page.tsx          タイトル画面
  craft/page.tsx    クラフト（ウィザード）＋誕生演出
  play/page.tsx     クエスト実行・チャット・観戦ログ演出
  api/run/route.ts  実行API（NDJSONストリーミング / 実API+モックフォールバック）
lib/
  types.ts          AgentSpec・RunEvent（設計書のプロトコル原型）
  presets.ts        アバター・性格・スキルのマスタデータ
  prompt.ts         AgentSpec → システムプロンプトのコンパイル
```
