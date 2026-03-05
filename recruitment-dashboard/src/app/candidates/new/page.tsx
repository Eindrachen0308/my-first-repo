"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Job, SelectionStage, PIPELINE_STAGES } from "@/types";

const SOURCES = ["自社サイト", "LinkedIn", "Wantedly", "リファラル", "エージェント", "Green", "その他"];

export default function NewCandidatePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    jobId: "",
    source: "自社サイト",
    currentStage: "応募" as SelectionStage,
    notes: "",
    rating: 3,
    assignee: "",
    tags: [] as string[],
  });

  useEffect(() => {
    fetch("/api/jobs").then((r) => r.json()).then((data) => {
      setJobs(data);
      if (data.length > 0) setForm((f) => ({ ...f, jobId: data[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/candidates");
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">候補者を追加</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">名前 *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">メールアドレス *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">電話番号</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">応募求人 *</label>
          <select
            required
            value={form.jobId}
            onChange={(e) => setForm({ ...form, jobId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">応募経路</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">選考ステージ</label>
          <select
            value={form.currentStage}
            onChange={(e) => setForm({ ...form, currentStage: e.target.value as SelectionStage })}
            className="w-full border rounded-lg px-3 py-2"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">担当者</label>
          <input
            type="text"
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">評価</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm({ ...form, rating: star })}
                className={`text-2xl ${star <= form.rating ? "text-yellow-400" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-24"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            登録
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
