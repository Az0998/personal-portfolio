import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { worksContent, profileContent } from "../src/data/works-content";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  await prisma.profile.upsert({
    where: { id: "default-profile" },
    update: { ...profileContent },
    create: { id: "default-profile", ...profileContent },
  });

  // Always upsert curated works so deploy syncs progress from repo
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
    if (existing) {
      await prisma.work.update({ where: { id: existing.id }, data });
    } else {
      await prisma.work.create({ data });
    }
  }

  // Optional: wipe everything and reseed (destructive)
  if (process.env.FORCE_SEED === "1") {
    const keepTitles = new Set(worksContent.map((w) => w.title));
    const all = await prisma.work.findMany();
    for (const w of all) {
      if (!keepTitles.has(w.title) && !w.title.startsWith("GitHub · ")) {
        await prisma.work.delete({ where: { id: w.id } });
      }
    }
  }

  console.log(`Synced ${worksContent.length} curated works + profile`);
  console.log(`Admin login: ${username} / (from ADMIN_PASSWORD)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
