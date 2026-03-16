"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, FunnelChart, Funnel, LabelList,
} from "recharts";
import { DashboardMetrics, PIPELINE_STAGES } from "@/types";
import StageBadge from "@/components/Stagebadge";

const COLORS = ["#3b82f6", "#6366f1", "#eab308", "#f97316", "#a855f7", "#22c55e", "#10b981", "#ef4444", "#64748b"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setMetrics);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  }

  const stageData = PIPELINE_STAGES.map((stage) => ({
    name: stage,
    count: metrics.stageDistribution[stage] || 0,
  }));

  const sourceData = Object.entries(metrics.candidatesBySource).map(([name, value]) => ({
    name,
    value,
  }));

  const leadTimeData = Object.entries(metrics.averageLeadTime)
    .filter(([key]) => !key.includes("不合格") && !key.includes("辞退"))
    .map(([name, days]) => ({ name, days }));

  const funnelData = PIPELINE_STAGES.map((stage, i) => ({
    name: stage,
    value: metrics.stageDistribution[stage] || 0,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="総候補者数" value={metrics.totalCandidates} color="blue" />
        <SummaryCard label="選考中" value={metrics.activeCandidates} color="green" />
        <SummaryCard label="総求人数" value={metrics.totalJobs} color="purple" />
        <SummaryCard label="募集中の求人" value={metrics.activeJobs} color="orange" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">選考パイプライン</h2>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution Bar Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">ステージ別候補者数</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Source Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">応募経路別</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Time */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">平均リードタイム（日数）</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadTimeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="days" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Rates */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">通過率</h2>
          <div className="space-y-3">
            {metrics.conversionRates.map((cr) => (
              <div key={`${cr.from}-${cr.to}`} className="flex items-center gap-3">
                <span className="text-sm w-28 text-right">{cr.from}</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm w-28">{cr.to}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${cr.rate}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{cr.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">月別応募数推移</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.candidatesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">最近のアクティビティ</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {metrics.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-500 w-36">
                {new Date(activity.changedAt).toLocaleString("ja-JP")}
              </span>
              <StageBadge stage={activity.from} />
              <span className="text-gray-400">→</span>
              <StageBadge stage={activity.to} />
              {activity.note && <span className="text-xs text-gray-500 ml-2">{activity.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };
  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
