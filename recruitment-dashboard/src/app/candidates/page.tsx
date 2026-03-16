"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Candidate, Job, SelectionStage, PIPELINE_STAGES } from "@/types";
import StageBadge from "@/components/Stagebadge";
import RatingStars from "@/components/RatingStars";

const ALL_STAGES: SelectionStage[] = [...PIPELINE_STAGES, "不合格", "辞退"];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  useEffect(() => {
    fetchCandidates();
    fetch("/api/jobs").then((r) => r.json()).then(setJobs);
  }, []);

  const fetchCandidates = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    if (jobFilter) params.set("jobId", jobFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    fetch(`/api/candidates?${params}`).then((r) => r.json()).then(setCandidates);
  };

  useEffect(() => {
    fetchCandidates();
  }, [stageFilter, jobFilter, sourceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleStageChange = async (candidateId: string, newStage: SelectionStage) => {
    await fetch(`/api/candidates/${candidateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newStage }),
    });
    fetchCandidates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この候補者を削除しますか？")) return;
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    fetchCandidates();
  };

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));
  const sources = [...new Set(candidates.map((c) => c.source))];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">候補者管理</h1>
        <div className="flex gap-3">
          <div className="flex bg-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm ${viewMode === "table" ? "bg-blue-600 text-white" : ""}`}
            >
              テーブル
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-sm ${viewMode === "kanban" ? "bg-blue-600 text-white" : ""}`}
            >
              カンバン
            </button>
          </div>
          <Link
            href="/candidates/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 候補者を追加
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="名前・メールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 w-64 text-sm"
            />
            <button type="submit" className="bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              検索
            </button>
          </form>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全ステージ</option>
            {ALL_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全求人</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全応募経路</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">{candidates.length}件の候補者</div>

      {viewMode === "table" ? (
        <TableView
          candidates={candidates}
          jobMap={jobMap}
          onStageChange={handleStageChange}
          onDelete={handleDelete}
        />
      ) : (
        <KanbanView
          candidates={candidates}
          jobMap={jobMap}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}

function TableView({
  candidates,
  jobMap,
  onStageChange,
  onDelete,
}: {
  candidates: Candidate[];
  jobMap: Record<string, string>;
  onStageChange: (id: string, stage: SelectionStage) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-4 font-medium">名前</th>
            <th className="text-left p-4 font-medium">求人</th>
            <th className="text-left p-4 font-medium">ステージ</th>
            <th className="text-left p-4 font-medium">応募経路</th>
            <th className="text-left p-4 font-medium">評価</th>
            <th className="text-left p-4 font-medium">担当者</th>
            <th className="text-left p-4 font-medium">応募日</th>
            <th className="text-left p-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <Link href={`/candidates/${c.id}`} className="text-blue-600 hover:underline font-medium">
                  {c.name}
                </Link>
                <div className="text-xs text-gray-500">{c.email}</div>
              </td>
              <td className="p-4 text-gray-600">{jobMap[c.jobId] || "-"}</td>
              <td className="p-4">
                <select
                  value={c.currentStage}
                  onChange={(e) => onStageChange(c.id, e.target.value as SelectionStage)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  {ALL_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="p-4 text-gray-600">{c.source}</td>
              <td className="p-4"><RatingStars rating={c.rating} /></td>
              <td className="p-4 text-gray-600">{c.assignee || "-"}</td>
              <td className="p-4 text-gray-500 text-xs">
                {new Date(c.createdAt).toLocaleDateString("ja-JP")}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Link href={`/candidates/${c.id}`} className="text-blue-600 hover:underline text-xs">
                    詳細
                  </Link>
                  <button onClick={() => onDelete(c.id)} className="text-red-600 hover:underline text-xs">
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({
  candidates,
  jobMap,
  onStageChange,
}: {
  candidates: Candidate[];
  jobMap: Record<string, string>;
  onStageChange: (id: string, stage: SelectionStage) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) => c.currentStage === stage);
        return (
          <div key={stage} className="min-w-[280px] bg-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <StageBadge stage={stage} />
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                {stageCandidates.length}
              </span>
            </div>
            <div className="space-y-2">
              {stageCandidates.map((c) => (
                <div key={c.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow transition-shadow">
                  <Link href={`/candidates/${c.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                    {c.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">{jobMap[c.jobId] || "-"}</div>
                  <div className="flex items-center justify-between mt-2">
                    <RatingStars rating={c.rating} />
                    <span className="text-xs text-gray-400">{c.assignee}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {PIPELINE_STAGES.filter((s) => s !== stage).slice(0, 3).map((s) => (
                      <button
                        key={s}
                        onClick={() => onStageChange(c.id, s)}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded hover:bg-blue-100 hover:text-blue-700"
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
