import { NextRequest, NextResponse } from "next/server";
import { getTemplate, updateTemplate, deleteTemplate, restoreTemplateVersion } from "@/lib/store";
import { parseJsonBody, jsonError } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) return jsonError("Not found", 404);
  return NextResponse.json(template);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON or payload too large", 400);

  // Restore a previous version
  if (body.restoreVersion !== undefined) {
    const version = Number(body.restoreVersion);
    if (isNaN(version)) return jsonError("restoreVersion must be a number", 400);
    const template = restoreTemplateVersion(id, version);
    if (!template) return jsonError("Not found or version not found", 404);
    return NextResponse.json(template);
  }

  // Normal update
  const template = updateTemplate(id, {
    name: body.name as string | undefined,
    subject: body.subject as string | undefined,
    body: body.body as string | undefined,
    changeNote: body.changeNote as string | undefined,
  });
  if (!template) return jsonError("Not found", 404);
  return NextResponse.json(template);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteTemplate(id);
  if (!deleted) return jsonError("Not found", 404);
  return NextResponse.json({ success: true });
}
