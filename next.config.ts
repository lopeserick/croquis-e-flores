import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Fotos enviadas pelo painel ficam no bucket público "obras" do Supabase
// (src/features/catalog/image-url.ts). Só esse caminho pode ser otimizado.
// O `next start` lê este arquivo antes do .env.local: carrega aqui (na Vercel,
// as variáveis já estão no ambiente e isto não muda nada).
loadEnvConfig(process.cwd());
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: supabaseUrl ? [new URL("/storage/v1/object/public/obras/**", supabaseUrl)] : [],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
