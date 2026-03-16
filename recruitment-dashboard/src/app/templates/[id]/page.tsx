"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { MessageTemplate, TemplateVersion } from "@/types";

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((t: MessageTemplate) => {
        setTemplate(t);
        setName(t.name);
        setSubject(t.subject);
        setBody(t.body);
      })
      .catch(() => router.push("/templates"));
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const res = await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, body, changeNote: changeNote || undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "保存に失敗しました");
      setSaving(false);
      return;
    }

    const updated: MessageTemplate = await res.json();
    setTemplate(updated);
    setChangeNote("");
    setSaving(false);
  };

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`v${versionNumber} に復元しますか？現在の内容は新しいバージョンとして保存されます。`)) return;

    const res = await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restoreVersion: versionNumber }),
    });

    if (res.ok) {
      const updated: MessageTemplate = await res.json();
      setTemplate(updated);
      setName(updated.name);
      setSubject(updated.subject);
      setBody(updated.body);
      setSelectedVersion(null);
    }
  };

  if (!template) {
    return <div className="p-8 text-gray-400">読み込み中...</div>;
  }

  const hasChanges = name !== template.name || subject !== template.subject || body !== template.body;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push("/templates")} className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
            &larr; テンプレート一覧に戻る
          </button>
          <h1 className="text-2xl font-bold">テンプレートを編集</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${template.category === "メール" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            {template.category}
          </span>
          <span className="text-xs text-gray-400">v{template.currentVersion}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">テンプレート名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>

          {hasChanges && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">変更メモ（任意）</label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="例: 敬語表現を修正"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  setName(template.name);
                  setSubject(template.subject);
                  setBody(template.body);
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                変更を元に戻す
              </button>
            )}
          </div>
        </div>

        {/* Version History Sidebar */}
        <div className="bg-white rounded-xl shadow p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-3"
          >
            <span>バージョン履歴 ({template.versions.length})</span>
            <span className="text-gray-400">{showHistory ? "▲" : "▼"}</span>
          </button>

          {showHistory && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...template.versions].reverse().map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedVersion?.id === v.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:bg-gray-50"
                  } ${v.version === template.currentVersion ? "ring-2 ring-blue-200" : ""}`}
                  onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      v{v.version}
                      {v.version === template.currentVersion && (
                        <span className="ml-1 text-xs text-blue-600">(現在)</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{v.changeNote}</p>

                  {selectedVersion?.id === v.id && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">件名:</span>
                        <p className="text-gray-500 mt-0.5">{v.subject}</p>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-600">本文:</span>
                        <p className="text-gray-500 mt-0.5 whitespace-pre-wrap line-clamp-6">{v.body}</p>
                      </div>
                      {v.version !== template.currentVersion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(v.version);
                          }}
                          className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 mt-1"
                        >
                          このバージョンに復元
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showHistory && (
            <p className="text-xs text-gray-400">クリックして履歴を表示</p>
          )}
        </div>
      </div>
    </div>
  );
}
