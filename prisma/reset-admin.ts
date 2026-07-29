import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  const password = (process.env.ADMIN_PASSWORD || "admin123").trim();
  const hashed = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  const ok = await bcrypt.compare(password, hashed);
  console.log(`Admin reset: ${username} / ${password}`);
  console.log(`Password verify test: ${ok ? "OK" : "FAILED"}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
