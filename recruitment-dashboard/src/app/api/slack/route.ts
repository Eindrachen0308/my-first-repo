import { NextRequest, NextResponse } from "next/server";
import { getSlackConfig, updateSlackConfig, sendSlackNotification } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getSlackConfig());
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const config = updateSlackConfig(body);
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.test) {
    const success = await sendSlackNotification("🔔 テスト通知: 採用管理ダッシュボードからの接続テストです。");
    return NextResponse.json({ success });
  }
  if (body.message) {
    const success = await sendSlackNotification(body.message);
    return NextResponse.json({ success });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
