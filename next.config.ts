import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql", "@node-rs/argon2"],
  async headers() {
    return [{
      source: "/reset-password",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }];
  },
};

export default nextConfig;
