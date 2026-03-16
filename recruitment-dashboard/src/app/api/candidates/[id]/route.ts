import { NextRequest, NextResponse } from "next/server";
import { getCandidate, updateCandidate, deleteCandidate, updateCandidateStage, getSlackConfig, sendSlackNotification } from "@/lib/store";
import { parseJsonBody, jsonError, validateStageChange } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) return jsonError("Not found", 404);
  return NextResponse.json(candidate);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON or payload too large", 400);

  if (body.newStage) {
    const stageResult = validateStageChange(body);
    if (!stageResult.valid) return jsonError(stageResult.error, 400);

    const result = updateCandidateStage(id, stageResult.stage, stageResult.note);
    if (!result) return jsonError("Not found", 404);

    const config = getSlackConfig();
    if (config.enabled && config.notifyOnStageChange) {
      await sendSlackNotification(
        `🔄 候補者のステータスが変更されました: *${result.candidate.name}* ${result.change.from} → ${result.change.to}${stageResult.note ? `\nメモ: ${stageResult.note}` : ""}`
      );
    }

    return NextResponse.json(result.candidate);
  }

  const candidate = updateCandidate(id, body as Parameters<typeof updateCandidate>[1]);
  if (!candidate) return jsonError("Not found", 404);
  return NextResponse.json(candidate);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteCandidate(id);
  if (!deleted) return jsonError("Not found", 404);
  return NextResponse.json({ success: true });
}
