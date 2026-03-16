"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageTemplate, TemplateCategory } from "@/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filter, setFilter] = useState<TemplateCategory | "">("");

  useEffect(() => {
    const url = filter ? `/api/templates?category=${encodeURIComponent(filter)}` : "/api/templates";
    fetch(url).then((r) => r.json()).then(setTemplates);
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const categoryColors: Record<string, string> = {
    "メール": "bg-blue-100 text-blue-800",
    "タイムライン": "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">テンプレート管理</h1>
        <Link href="/templates/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + テンプレートを作成
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter("メール")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "メール" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
        >
          メール
        </button>
        <button
          onClick={() => setFilter("タイムライン")}
          className={`px-3 py-1 rounded-full text-sm ${filter === "タイムライン" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}
        >
          タイムライン
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <Link href={`/templates/${template.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                {template.name}
              </Link>
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category]}`}>
                {template.category}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              <p className="font-medium text-gray-700">{template.subject}</p>
            </div>
            <div className="text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap">
              {template.body}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-xs text-gray-400">
                v{template.currentVersion} | 更新: {new Date(template.updatedAt).toLocaleDateString("ja-JP")}
              </div>
              <div className="flex gap-3">
                <Link href={`/templates/${template.id}`} className="text-xs text-blue-600 hover:underline">
                  編集
                </Link>
                <button onClick={() => handleDelete(template.id)} className="text-xs text-red-600 hover:underline">
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          テンプレートがありません。「+ テンプレートを作成」から作成してください。
        </div>
      )}
    </div>
  );
}
