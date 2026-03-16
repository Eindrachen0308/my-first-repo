export type SelectionStage =
  | "応募"
  | "書類選考"
  | "一次面接"
  | "二次面接"
  | "最終面接"
  | "内定"
  | "入社"
  | "不合格"
  | "辞退";

export const ACTIVE_STAGES: SelectionStage[] = [
  "応募",
  "書類選考",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "入社",
];

export const PIPELINE_STAGES: SelectionStage[] = [
  "応募",
  "書類選考",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "入社",
];

export interface StatusChange {
  id: string;
  from: SelectionStage;
  to: SelectionStage;
  changedAt: string; // ISO date
  note?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currentStage: SelectionStage;
  jobId: string;
  source: string; // 応募経路
  resumeUrl?: string;
  notes: string;
  rating: number; // 1-5
  assignee?: string;
  tags: string[];
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: "正社員" | "契約社員" | "業務委託" | "パート・アルバイト" | "インターン";
  status: "募集中" | "一時停止" | "募集終了";
  description: string;
  requirements: string;
  salaryRange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  enabled: boolean;
  notifyOnStageChange: boolean;
  notifyOnNewCandidate: boolean;
  notifyOnNewJob: boolean;
}

export type TemplateCategory = "メール" | "タイムライン";

export interface TemplateVersion {
  id: string;
  version: number;
  subject: string;
  body: string;
  changeNote: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  currentVersion: number;
  versions: TemplateVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalCandidates: number;
  activeCandidates: number;
  totalJobs: number;
  activeJobs: number;
  stageDistribution: Record<SelectionStage, number>;
  averageLeadTime: Record<string, number>; // stage transition -> avg days
  recentActivity: StatusChange[];
  conversionRates: { from: SelectionStage; to: SelectionStage; rate: number }[];
  candidatesBySource: Record<string, number>;
  candidatesByMonth: { month: string; count: number }[];
}
