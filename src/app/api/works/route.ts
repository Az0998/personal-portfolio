import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (!all) where.published = true;
  if (category) where.category = category;

  const works = await prisma.work.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(works);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const coverFile = formData.get("coverImage") as File | null;

  let coverImage: string | null = null;
  if (coverFile && coverFile.size > 0) {
    try {
      coverImage = await saveUploadedFile(coverFile);
    } catch (e) {
      const message = e instanceof Error ? e.message : "封面上传失败";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const data = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    content: (formData.get("content") as string) || null,
    category: (formData.get("category") as string) || "project",
    tags: (formData.get("tags") as string) || null,
    link: (formData.get("link") as string) || null,
    github: (formData.get("github") as string) || null,
    featured: formData.get("featured") === "true",
    published: formData.get("published") !== "false",
    sortOrder: parseInt((formData.get("sortOrder") as string) || "0", 10),
    coverImage,
  };

  const work = await prisma.work.create({ data });
  return NextResponse.json(work);
}
