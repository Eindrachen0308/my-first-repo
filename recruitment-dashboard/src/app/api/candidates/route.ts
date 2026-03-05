import { NextRequest, NextResponse } from "next/server";
import { getCandidates, createCandidate, getSlackConfig, sendSlackNotification } from "@/lib/store";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let results = getCandidates();

  const stage = params.get("stage");
  if (stage) results = results.filter((c) => c.currentStage === stage);

  const jobId = params.get("jobId");
  if (jobId) results = results.filter((c) => c.jobId === jobId);

  const search = params.get("search");
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }

  const source = params.get("source");
  if (source) results = results.filter((c) => c.source === source);

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const candidate = createCandidate(body);

  const config = getSlackConfig();
  if (config.enabled && config.notifyOnNewCandidate) {
    await sendSlackNotification(
      `📋 新しい候補者が登録されました: *${candidate.name}* (${candidate.currentStage})`
    );
  }

  return NextResponse.json(candidate, { status: 201 });
}
