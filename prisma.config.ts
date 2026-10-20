import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "prisma/config";

// Studio necesita una URL absoluta en Windows; Migrate utiliza la ruta relativa de SQLite.
const databaseUrl = process.env.DATABASE_URL ?? (process.argv[2] === "studio"
  ? pathToFileURL(resolve("prisma/dev.db")).href
  : "file:./prisma/dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});