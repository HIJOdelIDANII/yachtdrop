import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// If DATABASE_URL is already set (e.g. by CI, dotenv-cli, or Vercel), don't override it.
// Otherwise load from .env.local → .env (Next.js convention).
// For prod, use `npm run migrate:prod` which injects .env.production.local via dotenv-cli.
if (!process.env["DATABASE_URL"]) {
  config({ path: ".env.local" });
  config({ path: ".env" });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
