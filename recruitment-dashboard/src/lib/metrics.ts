import { Candidate, DashboardMetrics, SelectionStage, PIPELINE_STAGES } from "@/types";
import { getCandidates, getJobs } from "./store";

export function calculateMetrics(): DashboardMetrics {
  const allCandidates = getCandidates();
  const allJobs = getJobs();

  const activeCandidates = allCandidates.filter(
    (c) => !["不合格", "辞退"].includes(c.currentStage)
  );

  // Stage distribution
  const stageDistribution = {} as Record<SelectionStage, number>;
  for (const stage of PIPELINE_STAGES) {
    stageDistribution[stage] = allCandidates.filter((c) => c.currentStage === stage).length;
  }
  stageDistribution["不合格"] = allCandidates.filter((c) => c.currentStage === "不合格").length;
  stageDistribution["辞退"] = allCandidates.filter((c) => c.currentStage === "辞退").length;

  // Average lead times between stages
  const leadTimes: Record<string, number[]> = {};
  for (const candidate of allCandidates) {
    for (const change of candidate.statusHistory) {
      const key = `${change.from} → ${change.to}`;
      if (!leadTimes[key]) leadTimes[key] = [];

      // Find the previous change or use createdAt
      const prevChangeIndex = candidate.statusHistory.indexOf(change) - 1;
      const prevDate = prevChangeIndex >= 0
        ? new Date(candidate.statusHistory[prevChangeIndex].changedAt)
        : new Date(candidate.createdAt);
      const currentDate = new Date(change.changedAt);
      const days = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 0) leadTimes[key].push(days);
    }
  }

  const averageLeadTime: Record<string, number> = {};
  for (const [key, times] of Object.entries(leadTimes)) {
    if (times.length > 0) {
      averageLeadTime[key] = Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
    }
  }

  // Conversion rates
  const conversionRates: DashboardMetrics["conversionRates"] = [];
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const from = PIPELINE_STAGES[i];
    const to = PIPELINE_STAGES[i + 1];
    const reachedFrom = allCandidates.filter((c) => {
      const stageIdx = PIPELINE_STAGES.indexOf(c.currentStage);
      const reachedViaHistory = c.statusHistory.some((h) => h.from === from || h.to === from);
      return stageIdx >= i || reachedViaHistory || c.currentStage === from;
    }).length;
    const reachedTo = allCandidates.filter((c) => {
      const stageIdx = PIPELINE_STAGES.indexOf(c.currentStage);
      return stageIdx >= i + 1 || c.statusHistory.some((h) => h.to === to);
    }).length;
    const rate = reachedFrom > 0 ? Math.round((reachedTo / reachedFrom) * 100) : 0;
    conversionRates.push({ from, to, rate });
  }

  // Recent activity
  const allChanges = allCandidates.flatMap((c) =>
    c.statusHistory.map((h) => ({ ...h, candidateName: c.name }))
  );
  allChanges.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  // Candidates by source
  const candidatesBySource: Record<string, number> = {};
  for (const c of allCandidates) {
    candidatesBySource[c.source] = (candidatesBySource[c.source] || 0) + 1;
  }

  // Candidates by month
  const monthCounts: Record<string, number> = {};
  for (const c of allCandidates) {
    const month = c.createdAt.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  }
  const candidatesByMonth = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return {
    totalCandidates: allCandidates.length,
    activeCandidates: activeCandidates.length,
    totalJobs: allJobs.length,
    activeJobs: allJobs.filter((j) => j.status === "募集中").length,
    stageDistribution,
    averageLeadTime,
    recentActivity: allChanges.slice(0, 20),
    conversionRates,
    candidatesBySource,
    candidatesByMonth,
  };
}

export function calculateLeadTimeForCandidate(candidate: Candidate): number {
  const created = new Date(candidate.createdAt).getTime();
  const lastChange = candidate.statusHistory.length > 0
    ? new Date(candidate.statusHistory[candidate.statusHistory.length - 1].changedAt).getTime()
    : created;
  return Math.round((lastChange - created) / (1000 * 60 * 60 * 24));
}
