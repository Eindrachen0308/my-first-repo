import { NextRequest, NextResponse } from "next/server";
import { PIPELINE_STAGES, SelectionStage } from "@/types";

const ALL_STAGES: SelectionStage[] = [...PIPELINE_STAGES, "不合格", "辞退"];

const MAX_STRING_LENGTH = 500;
const MAX_NOTES_LENGTH = 5000;

export async function parseJsonBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 100_000) return null; // 100KB limit
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isString(val: unknown): val is string {
  return typeof val === "string";
}

function sanitizeString(val: string, maxLength = MAX_STRING_LENGTH): string {
  return val.trim().slice(0, maxLength);
}

export function validateCandidateInput(body: Record<string, unknown>) {
  const errors: string[] = [];

  if (!body.name || !isString(body.name) || body.name.trim().length === 0) {
    errors.push("name is required");
  }
  if (!body.email || !isString(body.email) || !body.email.includes("@")) {
    errors.push("valid email is required");
  }
  if (!body.jobId || !isString(body.jobId)) {
    errors.push("jobId is required");
  }
  if (!body.currentStage || !ALL_STAGES.includes(body.currentStage as SelectionStage)) {
    errors.push("valid currentStage is required");
  }

  if (errors.length > 0) return { valid: false as const, errors };

  return {
    valid: true as const,
    data: {
      name: sanitizeString(body.name as string),
      email: sanitizeString(body.email as string),
      phone: isString(body.phone) ? sanitizeString(body.phone) : undefined,
      currentStage: body.currentStage as SelectionStage,
      jobId: sanitizeString(body.jobId as string),
      source: isString(body.source) ? sanitizeString(body.source) : "その他",
      notes: isString(body.notes) ? sanitizeString(body.notes, MAX_NOTES_LENGTH) : "",
      rating: typeof body.rating === "number" ? Math.min(5, Math.max(1, Math.round(body.rating))) : 3,
      assignee: isString(body.assignee) ? sanitizeString(body.assignee) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.filter(isString).map((t) => sanitizeString(t)).slice(0, 20) : [],
    },
  };
}

export function validateStageChange(body: Record<string, unknown>) {
  if (!body.newStage || !ALL_STAGES.includes(body.newStage as SelectionStage)) {
    return { valid: false as const, error: "valid newStage is required" };
  }
  return {
    valid: true as const,
    stage: body.newStage as SelectionStage,
    note: isString(body.note) ? sanitizeString(body.note) : undefined,
  };
}

export function validateJobInput(body: Record<string, unknown>) {
  const errors: string[] = [];

  if (!body.title || !isString(body.title) || body.title.trim().length === 0) {
    errors.push("title is required");
  }
  if (!body.department || !isString(body.department)) {
    errors.push("department is required");
  }

  if (errors.length > 0) return { valid: false as const, errors };

  const validTypes = ["正社員", "契約社員", "業務委託", "パート・アルバイト", "インターン"];
  const validStatuses = ["募集中", "一時停止", "募集終了"];

  return {
    valid: true as const,
    data: {
      title: sanitizeString(body.title as string),
      department: sanitizeString(body.department as string),
      location: isString(body.location) ? sanitizeString(body.location) : "",
      employmentType: validTypes.includes(body.employmentType as string)
        ? (body.employmentType as "正社員" | "契約社員" | "業務委託" | "パート・アルバイト" | "インターン")
        : "正社員",
      status: validStatuses.includes(body.status as string)
        ? (body.status as "募集中" | "一時停止" | "募集終了")
        : "募集中",
      description: isString(body.description) ? sanitizeString(body.description, MAX_NOTES_LENGTH) : "",
      requirements: isString(body.requirements) ? sanitizeString(body.requirements, MAX_NOTES_LENGTH) : "",
      salaryRange: isString(body.salaryRange) ? sanitizeString(body.salaryRange) : undefined,
    },
  };
}
