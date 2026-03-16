import { NextRequest, NextResponse } from "next/server";
import { getJobs, createJob, getSlackConfig, sendSlackNotification } from "@/lib/store";
import { parseJsonBody, jsonError, validateJobInput } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(getJobs());
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON or payload too large", 400);

  const result = validateJobInput(body);
  if (!result.valid) return jsonError(result.errors.join(", "), 400);

  const job = createJob(result.data);

  const config = getSlackConfig();
  if (config.enabled && config.notifyOnNewJob) {
    await sendSlackNotification(
      `🆕 新しい求人が作成されました: *${job.title}* (${job.department})`
    );
  }

  return NextResponse.json(job, { status: 201 });
}
