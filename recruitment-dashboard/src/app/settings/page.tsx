"use client";

import { useEffect, useState } from "react";
import { SlackConfig } from "@/types";

export default function SettingsPage() {
  const [config, setConfig] = useState<SlackConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slack").then((r) => r.json()).then(setConfig);
  }, []);

  if (!config) return <div className="p-8 text-gray-500">読み込み中...</div>;

  const handleSave = async () => {
    await fetch("/api/slack", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTestResult(null);
    const res = await fetch("/api/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    const data = await res.json();
    setTestResult(data.success ? "テスト通知を送信しました" : "送信に失敗しました。Webhook URLを確認してください。");
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      {/* Slack Integration */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Slack連携</h2>
        <p className="text-sm text-gray-500 mb-6">
          SlackのIncoming Webhook URLを設定すると、候補者のステータス変更や新規登録時に
          自動で通知が送信されます。
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">有効/無効</label>
            <button
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  config.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">{config.enabled ? "有効" : "無効"}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Webhook URL</label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">チャンネル</label>
            <input
              type="text"
              placeholder="#recruitment"
              value={config.channel}
              onChange={(e) => setConfig({ ...config, channel: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">通知設定</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.notifyOnStageChange}
                  onChange={(e) => setConfig({ ...config, notifyOnStageChange: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">ステータス変更時に通知</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.notifyOnNewCandidate}
                  onChange={(e) => setConfig({ ...config, notifyOnNewCandidate: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">新規候補者登録時に通知</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.notifyOnNewJob}
                  onChange={(e) => setConfig({ ...config, notifyOnNewJob: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">新規求人作成時に通知</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
              保存
            </button>
            <button onClick={handleTest} className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200 text-sm"
              disabled={!config.enabled || !config.webhookUrl}>
              テスト通知を送信
            </button>
          </div>

          {saved && <p className="text-green-600 text-sm">設定を保存しました</p>}
          {testResult && (
            <p className={`text-sm ${testResult.includes("成功") || testResult.includes("送信しました") ? "text-green-600" : "text-red-600"}`}>
              {testResult}
            </p>
          )}
        </div>
      </div>

      {/* Slack Usage Guide */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Slack連携の使い方</h2>
        <div className="text-sm text-gray-600 space-y-3">
          <div>
            <h3 className="font-medium text-gray-800">1. Slack Appの作成</h3>
            <p>Slack APIでIncoming Webhooksを有効にしたAppを作成します。</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">2. Webhook URLの取得</h3>
            <p>Incoming Webhooksの設定からWebhook URLをコピーします。</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">3. URLの設定</h3>
            <p>上記のフォームにWebhook URLを貼り付け、保存します。</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">通知される内容</h3>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>候補者のステータス変更（例: 書類選考 → 一次面接）</li>
              <li>新しい候補者の登録</li>
              <li>新しい求人の作成</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
