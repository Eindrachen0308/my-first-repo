import { NextRequest, NextResponse } from "next/server";
import { getJobs, createJob, getSlackConfig, sendSlackNotification } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getJobs());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const job = createJob(body);

  const config = getSlackConfig();
  if (config.enabled && config.notifyOnNewJob) {
    await sendSlackNotification(
      `🆕 新しい求人が作成されました: *${job.title}* (${job.department})`
    );
  }

  return NextResponse.json(job, { status: 201 });
}
