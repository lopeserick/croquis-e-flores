import { createHash } from "node:crypto";

// IP do cliente guardado só como hash com sal (LGPD): serve para limitar
// tentativas sem saber de quem é o endereço.

/** Primeiro IP do x-forwarded-for (Vercel), ou x-real-ip. */
export function clientIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "desconhecido";
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
