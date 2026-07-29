import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });
  if (!work) return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json(work);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const coverFile = formData.get("coverImage") as File | null;

  const data: Record<string, unknown> = {};
  const fields = ["title", "description", "content", "category", "tags", "link", "github"];
  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) data[field] = value as string;
  }

  if (formData.has("featured")) data.featured = formData.get("featured") === "true";
  if (formData.has("published")) data.published = formData.get("published") !== "false";
  if (formData.has("sortOrder")) data.sortOrder = parseInt(formData.get("sortOrder") as string, 10);

  if (coverFile && coverFile.size > 0) {
    try {
      data.coverImage = await saveUploadedFile(coverFile);
    } catch (e) {
      const message = e instanceof Error ? e.message : "封面上传失败";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const work = await prisma.work.update({ where: { id }, data });
  return NextResponse.json(work);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.work.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
