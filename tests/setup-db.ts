import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function setup() {
  const db = resolve("prisma/test-auth.db");
  if (existsSync(db)) rmSync(db);
  for (const suffix of ["-journal", "-shm", "-wal"]) {
    if (existsSync(db + suffix)) rmSync(db + suffix);
  }
  writeFileSync(db, "");
  execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: "file:./prisma/test-auth.db" },
    stdio: "pipe",
  });
}
