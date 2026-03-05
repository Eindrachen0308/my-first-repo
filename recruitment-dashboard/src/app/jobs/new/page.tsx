"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Job } from "@/types";

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "東京",
    employmentType: "正社員" as Job["employmentType"],
    status: "募集中" as Job["status"],
    description: "",
    requirements: "",
    salaryRange: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/jobs");
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">求人を作成</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">求人タイトル *</label>
          <input required type="text" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">部門 *</label>
            <input required type="text" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">勤務地</label>
            <input type="text" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">雇用形態</label>
            <select value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value as Job["employmentType"] })}
              className="w-full border rounded-lg px-3 py-2">
              <option value="正社員">正社員</option>
              <option value="契約社員">契約社員</option>
              <option value="業務委託">業務委託</option>
              <option value="パート・アルバイト">パート・アルバイト</option>
              <option value="インターン">インターン</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">年収レンジ</label>
            <input type="text" value={form.salaryRange} placeholder="例: 600万〜900万"
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">職務内容</label>
          <textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-24" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">応募要件</label>
          <textarea value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-24" />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">作成</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200">キャンセル</button>
        </div>
      </form>
    </div>
  );
}
