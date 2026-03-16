"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateCategory } from "@/types";

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("メール");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, subject, body }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "保存に失敗しました");
      setSaving(false);
      return;
    }

    const template = await res.json();
    router.push(`/templates/${template.id}`);
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">テンプレートを作成</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">テンプレート名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="例: 面接日程調整メール"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="メール">メール</option>
            <option value="タイムライン">タイムライン</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="例: 【株式会社○○】面接日程のご案内"
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">{"{{candidate_name}}, {{job_title}} などの変数が使えます"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={12}
            placeholder="テンプレートの本文を入力..."
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            {"使用可能な変数: {{candidate_name}}, {{job_title}}, {{company}}, {{stage}}, {{date}}"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/templates")}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
