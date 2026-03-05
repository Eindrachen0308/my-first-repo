import { NextRequest, NextResponse } from "next/server";
import { getSlackConfig, updateSlackConfig, sendSlackNotification } from "@/lib/store";
import { parseJsonBody, jsonError } from "@/lib/validation";

export async function GET() {
  const config = getSlackConfig();
  return NextResponse.json({
    ...config,
    webhookUrl: config.webhookUrl ? "https://hooks.slack.com/services/***" : "",
    hasWebhookUrl: !!config.webhookUrl,
  });
}

export async function PUT(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON", 400);

  if (body.webhookUrl && typeof body.webhookUrl === "string") {
    if (!body.webhookUrl.startsWith("https://hooks.slack.com/")) {
      return jsonError("Invalid webhook URL format", 400);
    }
  }

  const config = updateSlackConfig({
    webhookUrl: typeof body.webhookUrl === "string" ? body.webhookUrl : undefined,
    channel: typeof body.channel === "string" ? body.channel.slice(0, 100) : undefined,
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    notifyOnStageChange: typeof body.notifyOnStageChange === "boolean" ? body.notifyOnStageChange : undefined,
    notifyOnNewCandidate: typeof body.notifyOnNewCandidate === "boolean" ? body.notifyOnNewCandidate : undefined,
    notifyOnNewJob: typeof body.notifyOnNewJob === "boolean" ? body.notifyOnNewJob : undefined,
  });
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (!body) return jsonError("Invalid JSON", 400);

  if (body.test) {
    const success = await sendSlackNotification("🔔 テスト通知: 採用管理ダッシュボードからの接続テストです。");
    return NextResponse.json({ success });
  }
  if (typeof body.message === "string") {
    const success = await sendSlackNotification(body.message.slice(0, 2000));
    return NextResponse.json({ success });
  }
  return jsonError("Invalid request", 400);
}
