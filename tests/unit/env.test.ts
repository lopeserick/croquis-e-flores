import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const validSupabase = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc",
};

const validAdmin = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_abc",
};

describe("parseEnv", () => {
  it("devolve só as variáveis do grupo quando são válidas", () => {
    const env = parseEnv("supabase", { ...validSupabase, ...validAdmin, OUTRA: "x" });
    expect(env).toEqual(validSupabase);
  });

  it("leitura pública não exige a chave secreta", () => {
    expect(() => parseEnv("supabase", validSupabase)).not.toThrow();
  });

  it("lista as variáveis ausentes na mensagem de erro", () => {
    expect(() => parseEnv("supabase", {})).toThrow(
      /\(supabase\): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("rejeita chave com formato errado", () => {
    expect(() =>
      parseEnv("supabaseAdmin", { ...validAdmin, SUPABASE_SECRET_KEY: "sb_publishable_trocada" }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("nunca coloca o valor de uma variável na mensagem de erro", () => {
    const secret = "valor-secreto-curto";
    expect(() => parseEnv("security", { CRON_SECRET: secret, IP_HASH_SALT: secret })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(secret) }),
    );
  });

  it("rejeita URL do site inválida", () => {
    expect(() => parseEnv("site", { NEXT_PUBLIC_SITE_URL: "localhost" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });
});
