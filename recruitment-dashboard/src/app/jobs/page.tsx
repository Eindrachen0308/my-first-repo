"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job, Candidate } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    fetch("/api/jobs").then((r) => r.json()).then(setJobs);
    fetch("/api/candidates").then((r) => r.json()).then(setCandidates);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("この求人を削除しますか？")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const handleStatusChange = async (id: string, status: Job["status"]) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setJobs(jobs.map((j) => (j.id === id ? updated : j)));
  };

  const statusColors: Record<string, string> = {
    "募集中": "bg-green-100 text-green-800",
    "一時停止": "bg-yellow-100 text-yellow-800",
    "募集終了": "bg-gray-100 text-gray-800",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">求人管理</h1>
        <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + 求人を作成
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => {
          const jobCandidates = candidates.filter((c) => c.jobId === job.id);
          const activeCandidates = jobCandidates.filter(
            (c) => !["不合格", "辞退"].includes(c.currentStage)
          );
          return (
            <div key={job.id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                  {job.title}
                </Link>
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value as Job["status"])}
                  className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[job.status]}`}
                >
                  <option value="募集中">募集中</option>
                  <option value="一時停止">一時停止</option>
                  <option value="募集終了">募集終了</option>
                </select>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>{job.department} | {job.location}</p>
                <p>{job.employmentType}</p>
                {job.salaryRange && <p>{job.salaryRange}</p>}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-500">候補者: </span>
                  <span className="font-medium">{jobCandidates.length}名</span>
                  <span className="text-gray-400 ml-1">(選考中: {activeCandidates.length}名)</span>
                </div>
                <button onClick={() => handleDelete(job.id)} className="text-xs text-red-600 hover:underline">
                  削除
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                作成日: {new Date(job.createdAt).toLocaleDateString("ja-JP")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
