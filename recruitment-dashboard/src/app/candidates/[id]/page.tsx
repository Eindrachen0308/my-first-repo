"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Candidate, Job, SelectionStage, PIPELINE_STAGES } from "@/types";
import StageBadge from "@/components/Stagebadge";
import RatingStars from "@/components/RatingStars";

const ALL_STAGES: SelectionStage[] = [...PIPELINE_STAGES, "不合格", "辞退"];

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stageNote, setStageNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Candidate>>({});

  useEffect(() => {
    fetch(`/api/candidates/${id}`).then((r) => r.json()).then(setCandidate);
    fetch("/api/jobs").then((r) => r.json()).then(setJobs);
  }, [id]);

  if (!candidate) return <div className="p-8 text-gray-500">読み込み中...</div>;

  const job = jobs.find((j) => j.id === candidate.jobId);

  const handleStageChange = async (newStage: SelectionStage) => {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newStage, note: stageNote }),
    });
    const updated = await res.json();
    setCandidate(updated);
    setStageNote("");
  };

  const handleSave = async () => {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const updated = await res.json();
    setCandidate(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("この候補者を削除しますか？")) return;
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    router.push("/candidates");
  };

  const leadTimeDays = candidate.statusHistory.length > 0
    ? Math.round(
        (new Date(candidate.statusHistory[candidate.statusHistory.length - 1].changedAt).getTime() -
          new Date(candidate.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-gray-500">{candidate.email} {candidate.phone && `| ${candidate.phone}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(!editing); setEditForm(candidate); }}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
            {editing ? "キャンセル" : "編集"}
          </button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
            削除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Change */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">選考ステータス</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">現在:</span>
              <StageBadge stage={candidate.currentStage} />
            </div>

            {/* Pipeline Progress */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto">
              {PIPELINE_STAGES.map((stage, i) => {
                const currentIndex = PIPELINE_STAGES.indexOf(candidate.currentStage);
                const isPast = i <= currentIndex && currentIndex >= 0;
                const isCurrent = stage === candidate.currentStage;
                return (
                  <div key={stage} className="flex items-center">
                    <div
                      className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isPast
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {stage}
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <span className={`mx-1 ${isPast ? "text-blue-400" : "text-gray-300"}`}>→</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="メモ（任意）"
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleStageChange(e.target.value as SelectionStage);
                  e.target.value = "";
                }}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="" disabled>ステージ変更...</option>
                {ALL_STAGES.filter((s) => s !== candidate.currentStage).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">候補者情報を編集</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">名前</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">メール</label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">メモ</label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                  />
                </div>
                <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  保存
                </button>
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">選考履歴</h2>
            {candidate.statusHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">まだ履歴がありません</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {[...candidate.statusHistory].reverse().map((change) => (
                    <div key={change.id} className="relative pl-10">
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                      <div className="text-sm">
                        <span className="text-gray-500">
                          {new Date(change.changedAt).toLocaleString("ja-JP")}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <StageBadge stage={change.from} />
                          <span className="text-gray-400">→</span>
                          <StageBadge stage={change.to} />
                        </div>
                        {change.note && (
                          <p className="text-xs text-gray-500 mt-1">メモ: {change.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-3">基本情報</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">応募求人</dt>
                <dd className="font-medium">{job?.title || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">応募経路</dt>
                <dd>{candidate.source}</dd>
              </div>
              <div>
                <dt className="text-gray-500">担当者</dt>
                <dd>{candidate.assignee || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">評価</dt>
                <dd><RatingStars rating={candidate.rating} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">リードタイム</dt>
                <dd className="font-medium">{leadTimeDays}日</dd>
              </div>
              <div>
                <dt className="text-gray-500">応募日</dt>
                <dd>{new Date(candidate.createdAt).toLocaleDateString("ja-JP")}</dd>
              </div>
              <div>
                <dt className="text-gray-500">最終更新</dt>
                <dd>{new Date(candidate.updatedAt).toLocaleDateString("ja-JP")}</dd>
              </div>
            </dl>
          </div>

          {candidate.notes && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-3">メモ</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{candidate.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
