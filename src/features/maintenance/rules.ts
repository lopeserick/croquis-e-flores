import { timingSafeEqual } from "node:crypto";

// Regras da rotina diária de manutenção (entrega 10). Sem acesso ao banco:
// testadas em tests/unit/maintenance.test.ts.

const HOUR = 60 * 60 * 1000;

/** Arquivo enviado e não usado só é apagado depois deste tempo (pode ser um envio em andamento). */
export const ORPHAN_AGE_HOURS = 24;
/** E-mail que falhou é tentado de novo, no máximo, este número de vezes no total. */
export const MAX_EMAIL_ATTEMPTS = 3;
/** Pedido "pendente" há mais que isso: o envio do e-mail não chegou a terminar. */
export const PENDING_EMAIL_MINUTES = 10;
/** Só reenvia e-mails de pedidos recentes (um aviso de semanas atrás já não ajuda). */
export const EMAIL_RETRY_DAYS = 7;
/** Por rodada, para a rotina não passar do tempo limite da hospedagem. */
export const MAX_EMAILS_PER_RUN = 10;

/** Cabeçalho "Authorization: Bearer <CRON_SECRET>" (é o que a Vercel envia). Comparação em tempo constante. */
export function isAuthorizedCron(header: string | null, secret: string): boolean {
  if (!header || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export const isOlderThan = (iso: string | null | undefined, hours: number, now: Date) =>
  !!iso && now.getTime() - new Date(iso).getTime() > hours * HOUR;

export type EmailCandidate = { id: string; emailStatus: "pendente" | "enviado" | "falhou"; createdAt: string; failures: number };

/** Pedidos cujo e-mail de aviso deve ser tentado de novo nesta rodada. */
export function emailRetryCandidates(orders: EmailCandidate[], now: Date): string[] {
  return orders
    .filter((o) => {
      if (o.emailStatus === "enviado" || o.failures >= MAX_EMAIL_ATTEMPTS) return false;
      if (isOlderThan(o.createdAt, EMAIL_RETRY_DAYS * 24, now)) return false;
      return o.emailStatus === "falhou" || isOlderThan(o.createdAt, PENDING_EMAIL_MINUTES / 60, now);
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, MAX_EMAILS_PER_RUN)
    .map((o) => o.id);
}

/** Pasta de fotos de um pedido que nunca foi registrado (o cliente desistiu no meio do envio). */
export function isAbandonedReferenceFolder(
  folder: { key: string; newestFileAt: string | null },
  orderKeys: ReadonlySet<string>,
  now: Date,
): boolean {
  if (orderKeys.has(folder.key)) return false;
  // Pasta vazia ou com arquivos antigos: o envio não está mais em andamento.
  return folder.newestFileAt === null || isOlderThan(folder.newestFileAt, ORPHAN_AGE_HOURS, now);
}

/** Foto da galeria que nenhuma obra, coleção, modalidade ou texto usa, enviada há mais de 24 h. */
export const isUnusedGalleryFile = (
  file: { path: string; createdAt: string | null },
  used: ReadonlySet<string>,
  now: Date,
) => !used.has(file.path) && isOlderThan(file.createdAt, ORPHAN_AGE_HOURS, now);

/** Caminhos de foto citados dentro de um JSON (coleção, modalidade, configurações). */
export function imagePathsIn(value: unknown, found: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => imagePathsIn(v, found));
  else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.path === "string" && typeof record.alt === "string") found.add(record.path);
    Object.values(record).forEach((v) => imagePathsIn(v, found));
  }
  return found;
}

/** Data limite da retenção: pedidos concluídos ou cancelados antes dela perdem as fotos. null = não apagar. */
export function retentionCutoff(days: number | null, now: Date): Date | null {
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * HOUR);
}
