import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";

export async function GET() {
  const profile = await prisma.profile.findFirst();
  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const profile = await prisma.profile.findFirst();

  const data: Record<string, string | null> = {};
  const fields = [
    "name", "title", "tagline", "bio", "email", "phone",
    "location", "github", "linkedin", "twitter", "website", "wechat", "resumeUrl",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) data[field] = value as string;
  }

  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    try {
      data.avatar = await saveUploadedFile(avatarFile);
    } catch (e) {
      const message = e instanceof Error ? e.message : "头像上传失败";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (profile) {
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data,
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.profile.create({
    data: data as Parameters<typeof prisma.profile.create>[0]["data"],
  });
  return NextResponse.json(created);
}
