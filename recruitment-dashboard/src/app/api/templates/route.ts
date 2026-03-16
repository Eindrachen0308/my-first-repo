import { NextRequest, NextResponse } from "next/server";
import { getTemplates, createTemplate } from "@/lib/store";
import { parseJsonBody, jsonError } from "@/lib/validation";
import { TemplateCategory } from "@/types";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") as TemplateCategory | null;
  const templates = getTemplates(category || undefined);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON or payload too large", 400);

  const name = body.name as string | undefined;
  const category = body.category as string | undefined;
  const subject = body.subject as string | undefined;
  const bodyText = body.body as string | undefined;

  if (!name || !name.trim()) return jsonError("name is required", 400);
  if (!category || !["メール", "タイムライン"].includes(category)) {
    return jsonError("category must be メール or タイムライン", 400);
  }
  if (!subject || !subject.trim()) return jsonError("subject is required", 400);
  if (!bodyText || !bodyText.trim()) return jsonError("body is required", 400);

  const template = createTemplate({
    name: name.trim(),
    category: category as TemplateCategory,
    subject: subject.trim(),
    body: bodyText.trim(),
  });

  return NextResponse.json(template, { status: 201 });
}
