import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { worksContent, profileContent } from "../src/data/works-content";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);
  const force = process.env.FORCE_SEED === "1";

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  const existingProfile = await prisma.profile.findUnique({
    where: { id: "default-profile" },
  });
  if (!existingProfile) {
    await prisma.profile.create({
      data: { id: "default-profile", ...profileContent },
    });
    console.log("Created default profile");
  } else {
    console.log("Kept existing profile (avatar/sponsor/contacts preserved)");
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const work of worksContent) {
    const existing = await prisma.work.findFirst({ where: { title: work.title } });
    const data = {
      title: work.title,
      description: work.description,
      content: work.content,
      category: work.category,
      tags: work.tags,
      featured: work.featured,
      published: work.published,
      sortOrder: work.sortOrder,
      github: work.github ?? null,
      link: work.link ?? null,
    };

    if (!existing) {
      await prisma.work.create({ data: { ...data, locked: false } });
      created += 1;
      continue;
    }

    if (force && !existing.locked) {
      await prisma.work.update({ where: { id: existing.id }, data });
      updated += 1;
      continue;
    }

    if (existing.locked) {
      skipped += 1;
      continue;
    }

    // 轻量更新：分类 / 精选 / 排序 / 链接；保留正文与封面
    await prisma.work.update({
      where: { id: existing.id },
      data: {
        category: work.category,
        tags: work.tags,
        featured: work.featured,
        published: work.published,
        sortOrder: work.sortOrder,
        github: work.github ?? null,
        link: work.link ?? null,
      },
    });
    updated += 1;
  }

  console.log(
    `Works seed: created ${created}, force-updated ${updated}, kept ${skipped}`
  );
  console.log(`Admin: ${username}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
