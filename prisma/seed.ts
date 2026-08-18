import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "demo@cite.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@cite.app",
      passwordHash,
    },
  });

  console.log("Seed complete.");
  console.log("Demo account (password: password123): demo@cite.app");
  console.log("Upload a PDF after signing in to try the RAG pipeline — no documents are pre-seeded");
  console.log("since embedding them requires a live LLM API key.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
