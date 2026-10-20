import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

process.env.DATABASE_URL = "file:./prisma/test-auth.db";
process.env.AUTH_SECRET = "vitest-only-secret-with-at-least-32-characters";
process.env.APP_URL = "http://localhost:3000";
process.env.TRUST_PROXY = "true";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic", importSource: "react" } },
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/setup-db.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["lib/auth/**/*.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80 },
    },
  },
});
