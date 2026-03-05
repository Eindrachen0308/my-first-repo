import { NextRequest, NextResponse } from "next/server";
import { getCandidate, updateCandidate, deleteCandidate, updateCandidateStage, getSlackConfig, sendSlackNotification } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(candidate);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // Check if this is a stage change
  if (body.newStage) {
    const result = updateCandidateStage(id, body.newStage, body.note);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const config = getSlackConfig();
    if (config.enabled && config.notifyOnStageChange) {
      await sendSlackNotification(
        `🔄 候補者のステータスが変更されました: *${result.candidate.name}* ${result.change.from} → ${result.change.to}${body.note ? `\nメモ: ${body.note}` : ""}`
      );
    }

    return NextResponse.json(result.candidate);
  }

  const candidate = updateCandidate(id, body);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(candidate);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteCandidate(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
