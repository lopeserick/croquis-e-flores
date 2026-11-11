import { existsSync } from "node:fs";

// Estes testes gravam linhas de teste (prefixo "teste-") e as apagam no fim.
// Rodar só contra o projeto de desenvolvimento.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = process.env.SUPABASE_PROJECT_REF ?? "";
if (!url || !ref) throw new Error("Testes de banco precisam do .env.local com as chaves do Supabase.");
if (!url.includes(ref)) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_PROJECT_REF apontam para projetos diferentes.");
}
