import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runFullSync } from "@/lib/sync";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const githubUser = String(body.githubUser || process.env.GITHUB_USER || "Az0998");

  try {
    const result = await runFullSync(githubUser);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "同步失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
