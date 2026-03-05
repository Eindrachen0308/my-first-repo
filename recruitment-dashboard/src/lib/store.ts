import { Candidate, Job, SlackConfig, StatusChange, SelectionStage, PIPELINE_STAGES } from "@/types";
import { v4 as uuidv4 } from "uuid";

// In-memory store (would be replaced by a database in production)
let candidates: Candidate[] = [];
let jobs: Job[] = [];
let slackConfig: SlackConfig = {
  webhookUrl: "",
  channel: "#recruitment",
  enabled: false,
  notifyOnStageChange: true,
  notifyOnNewCandidate: true,
  notifyOnNewJob: true,
};

// Initialize with sample data
function initSampleData() {
  if (jobs.length > 0) return;

  const sampleJobs: Job[] = [
    {
      id: uuidv4(),
      title: "フロントエンドエンジニア",
      department: "エンジニアリング",
      location: "東京",
      employmentType: "正社員",
      status: "募集中",
      description: "React/Next.jsを用いたフロントエンド開発",
      requirements: "React経験3年以上、TypeScript経験",
      salaryRange: "600万〜900万",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: "バックエンドエンジニア",
      department: "エンジニアリング",
      location: "東京",
      employmentType: "正社員",
      status: "募集中",
      description: "Go/Pythonを用いたバックエンド開発",
      requirements: "バックエンド開発経験3年以上",
      salaryRange: "600万〜1000万",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: "プロダクトマネージャー",
      department: "プロダクト",
      location: "東京・リモート",
      employmentType: "正社員",
      status: "募集中",
      description: "プロダクト戦略の策定と実行",
      requirements: "PM経験3年以上",
      salaryRange: "700万〜1100万",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  jobs = sampleJobs;

  const sources = ["自社サイト", "LinkedIn", "Wantedly", "リファラル", "エージェント", "Green"];
  const names = [
    "田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲", "伊藤健太",
    "渡辺直美", "山本大輔", "中村さくら", "小林拓也", "加藤由美",
    "吉田翔太", "山田理恵", "松本浩二", "井上真理", "木村達也",
  ];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  names.forEach((name, i) => {
    const createdDaysAgo = Math.floor(Math.random() * 60) + 5;
    const createdAt = new Date(now - createdDaysAgo * day).toISOString();
    const jobIndex = i % sampleJobs.length;
    const stageIndex = Math.min(Math.floor(Math.random() * 7), 6);
    const isRejectedOrWithdrawn = Math.random() < 0.15;

    const currentStage: SelectionStage = isRejectedOrWithdrawn
      ? (Math.random() < 0.5 ? "不合格" : "辞退")
      : PIPELINE_STAGES[stageIndex];

    const history: StatusChange[] = [];
    const maxStage = isRejectedOrWithdrawn ? Math.min(stageIndex, 4) : stageIndex;

    for (let s = 0; s < maxStage; s++) {
      history.push({
        id: uuidv4(),
        from: PIPELINE_STAGES[s],
        to: PIPELINE_STAGES[s + 1],
        changedAt: new Date(now - (createdDaysAgo - (s + 1) * 3) * day).toISOString(),
        note: "",
      });
    }

    if (isRejectedOrWithdrawn) {
      history.push({
        id: uuidv4(),
        from: PIPELINE_STAGES[maxStage],
        to: currentStage,
        changedAt: new Date(now - (createdDaysAgo - (maxStage + 1) * 3) * day).toISOString(),
        note: currentStage === "不合格" ? "選考基準未達" : "候補者都合",
      });
    }

    candidates.push({
      id: uuidv4(),
      name,
      email: `${name.toLowerCase().replace(/\s/g, "")}@example.com`,
      phone: `090-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      currentStage,
      jobId: sampleJobs[jobIndex].id,
      source: sources[Math.floor(Math.random() * sources.length)],
      notes: "",
      rating: Math.floor(Math.random() * 5) + 1,
      assignee: ["山田HR", "佐々木HR", "田村HR"][Math.floor(Math.random() * 3)],
      tags: [],
      statusHistory: history,
      createdAt,
      updatedAt: new Date().toISOString(),
    });
  });
}

initSampleData();

// Candidate operations
export function getCandidates(): Candidate[] {
  return [...candidates];
}

export function getCandidate(id: string): Candidate | undefined {
  return candidates.find((c) => c.id === id);
}

export function createCandidate(data: Omit<Candidate, "id" | "createdAt" | "updatedAt" | "statusHistory">): Candidate {
  const candidate: Candidate = {
    ...data,
    id: uuidv4(),
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  candidates.push(candidate);
  return candidate;
}

export function updateCandidate(id: string, data: Partial<Candidate>): Candidate | undefined {
  const index = candidates.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  candidates[index] = { ...candidates[index], ...data, updatedAt: new Date().toISOString() };
  return candidates[index];
}

export function updateCandidateStage(
  id: string,
  newStage: SelectionStage,
  note?: string
): { candidate: Candidate; change: StatusChange } | undefined {
  const candidate = candidates.find((c) => c.id === id);
  if (!candidate) return undefined;

  const change: StatusChange = {
    id: uuidv4(),
    from: candidate.currentStage,
    to: newStage,
    changedAt: new Date().toISOString(),
    note,
  };

  candidate.currentStage = newStage;
  candidate.statusHistory.push(change);
  candidate.updatedAt = new Date().toISOString();

  return { candidate, change };
}

export function deleteCandidate(id: string): boolean {
  const len = candidates.length;
  candidates = candidates.filter((c) => c.id !== id);
  return candidates.length < len;
}

// Job operations
export function getJobs(): Job[] {
  return [...jobs];
}

export function getJob(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

export function createJob(data: Omit<Job, "id" | "createdAt" | "updatedAt">): Job {
  const job: Job = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.push(job);
  return job;
}

export function updateJob(id: string, data: Partial<Job>): Job | undefined {
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return undefined;
  jobs[index] = { ...jobs[index], ...data, updatedAt: new Date().toISOString() };
  return jobs[index];
}

export function deleteJob(id: string): boolean {
  const len = jobs.length;
  jobs = jobs.filter((j) => j.id !== id);
  return jobs.length < len;
}

// Slack operations
export function getSlackConfig(): SlackConfig {
  return { ...slackConfig };
}

export function updateSlackConfig(config: Partial<SlackConfig>): SlackConfig {
  slackConfig = { ...slackConfig, ...config };
  return { ...slackConfig };
}

export async function sendSlackNotification(message: string): Promise<boolean> {
  if (!slackConfig.enabled || !slackConfig.webhookUrl) return false;
  try {
    const res = await fetch(slackConfig.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: slackConfig.channel,
        text: message,
      }),
    });
    return res.ok;
  } catch {
    console.error("Slack notification failed");
    return false;
  }
}

// Metrics
export function getCandidatesForJob(jobId: string): Candidate[] {
  return candidates.filter((c) => c.jobId === jobId);
}
