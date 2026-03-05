"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Job, Candidate, PIPELINE_STAGES } from "@/types";
import StageBadge from "@/components/Stagebadge";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Job>>({});

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then((r) => r.json()).then(setJob);
    fetch(`/api/candidates?jobId=${id}`).then((r) => r.json()).then(setCandidates);
  }, [id]);

  if (!job) return <div className="p-8 text-gray-500">読み込み中...</div>;

  const handleSave = async () => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setJob(await res.json());
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("この求人を削除しますか？")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.push("/jobs");
  };

  const activeCandidates = candidates.filter((c) => !["不合格", "辞退"].includes(c.currentStage));

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
        ← 戻る
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-500">{job.department} | {job.location} | {job.employmentType}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(!editing); setEditForm(job); }}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
            {editing ? "キャンセル" : "編集"}
          </button>
          <button onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
            削除
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">求人情報を編集</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">タイトル</label>
              <input type="text" value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">職務内容</label>
              <textarea value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 h-24" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">応募要件</label>
              <textarea value={editForm.requirements || ""}
                onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 h-24" />
            </div>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              保存
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">職務内容</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.description || "未設定"}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">応募要件</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.requirements || "未設定"}</p>
          </div>

          {/* Candidates for this job */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">候補者一覧（{candidates.length}名）</h2>
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-sm">まだ候補者がいません</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2">名前</th>
                    <th className="text-left p-2">ステージ</th>
                    <th className="text-left p-2">応募日</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/candidates/${c.id}`} className="text-blue-600 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-2"><StageBadge stage={c.currentStage} /></td>
                      <td className="p-2 text-gray-500">{new Date(c.createdAt).toLocaleDateString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-3">求人概要</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">ステータス</dt>
                <dd className="font-medium">{job.status}</dd>
              </div>
              {job.salaryRange && (
                <div>
                  <dt className="text-gray-500">年収レンジ</dt>
                  <dd>{job.salaryRange}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">総応募者数</dt>
                <dd className="font-medium">{candidates.length}名</dd>
              </div>
              <div>
                <dt className="text-gray-500">選考中</dt>
                <dd className="font-medium">{activeCandidates.length}名</dd>
              </div>
              <div>
                <dt className="text-gray-500">作成日</dt>
                <dd>{new Date(job.createdAt).toLocaleDateString("ja-JP")}</dd>
              </div>
            </dl>
          </div>

          {/* Stage breakdown */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold mb-3">ステージ別内訳</h3>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage) => {
                const count = candidates.filter((c) => c.currentStage === stage).length;
                return (
                  <div key={stage} className="flex items-center justify-between text-sm">
                    <StageBadge stage={stage} />
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
