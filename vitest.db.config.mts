import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const stub = (file: string) => fileURLToPath(new URL(`./tests/stubs/${file}`, import.meta.url));

// Testes contra o projeto Supabase de DESENVOLVIMENTO (rede + .env.local).
// Separados do `npm test`, que roda sem internet. Uso: npm run test:db
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": stub("empty.ts"),
      // Fora do Next não há cache de páginas: cacheLife/cacheTag viram no-op.
      "next/cache": stub("next-cache.ts"),
    },
  },
  test: {
    include: ["tests/db/**/*.test.ts"],
    setupFiles: ["tests/db/setup.ts"],
    environment: "node",
    // Um arquivo por vez: os testes gravam e apagam linhas no mesmo banco.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
