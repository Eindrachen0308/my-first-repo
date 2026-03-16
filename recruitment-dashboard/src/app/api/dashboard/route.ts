import { NextResponse } from "next/server";
import { calculateMetrics } from "@/lib/metrics";

export async function GET() {
  return NextResponse.json(calculateMetrics());
}
