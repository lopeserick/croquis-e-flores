import { describe, expect, it } from "vitest";
import {
  emailRetryCandidates,
  imagePathsIn,
  isAbandonedReferenceFolder,
  isAuthorizedCron,
  isUnusedGalleryFile,
  MAX_EMAILS_PER_RUN,
  retentionCutoff,
} from "@/features/maintenance/rules";

const now = new Date("2026-11-14T12:00:00Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
const HOUR = 60;
const DAY = 24 * HOUR;
const secret = "a".repeat(64);

describe("acesso à rotina diária", () => {
  it("só com o cabeçalho exato da Vercel", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedCron(null, secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
    expect(isAuthorizedCron(`Bearer ${secret}x`, secret)).toBe(false);
  });

  it("segredo curto demais não protege nada: recusa sempre", () => {
    expect(isAuthorizedCron("Bearer curto", "curto")).toBe(false);
  });
});

describe("reenvio de e-mails", () => {
  const order = (id: string, emailStatus: "pendente" | "enviado" | "falhou", minutesAgo: number, failures = 1) => ({
    id,
    emailStatus,
    createdAt: ago(minutesAgo),
    failures,
  });

  it("tenta de novo o que falhou; pendente só depois de 10 minutos", () => {
    expect(
      emailRetryCandidates(
        [order("falhou", "falhou", 30), order("enviado", "enviado", 30), order("pendente-novo", "pendente", 5, 0), order("pendente-velho", "pendente", 30, 0)],
        now,
      ),
    ).toEqual(["falhou", "pendente-velho"]);
  });

  it("para depois de 3 falhas e não reenvia pedido de mais de 7 dias", () => {
    expect(emailRetryCandidates([order("cansou", "falhou", 30, 3), order("antigo", "falhou", 8 * DAY)], now)).toEqual([]);
  });

  it("no máximo 10 por rodada, os mais antigos primeiro", () => {
    const many = Array.from({ length: 15 }, (_, i) => order(`p${i}`, "falhou", (i + 1) * HOUR));
    const picked = emailRetryCandidates(many, now);
    expect(picked).toHaveLength(MAX_EMAILS_PER_RUN);
    expect(picked[0]).toBe("p14");
  });
});

describe("arquivos esquecidos", () => {
  const orderKeys = new Set(["com-pedido"]);

  it("pasta de fotos sem pedido só é apagada depois de 24 h", () => {
    expect(isAbandonedReferenceFolder({ key: "x", newestFileAt: ago(25 * HOUR) }, orderKeys, now)).toBe(true);
    expect(isAbandonedReferenceFolder({ key: "x", newestFileAt: ago(2 * HOUR) }, orderKeys, now)).toBe(false);
    expect(isAbandonedReferenceFolder({ key: "x", newestFileAt: null }, orderKeys, now)).toBe(true);
    expect(isAbandonedReferenceFolder({ key: "com-pedido", newestFileAt: ago(30 * DAY) }, orderKeys, now)).toBe(false);
  });

  it("foto da galeria sem uso só é apagada depois de 24 h; em uso, nunca", () => {
    const used = new Set(["obras/a/1.webp"]);
    expect(isUnusedGalleryFile({ path: "obras/a/2.webp", createdAt: ago(2 * DAY) }, used, now)).toBe(true);
    expect(isUnusedGalleryFile({ path: "obras/a/2.webp", createdAt: ago(HOUR) }, used, now)).toBe(false);
    expect(isUnusedGalleryFile({ path: "obras/a/1.webp", createdAt: ago(30 * DAY) }, used, now)).toBe(false);
    expect(isUnusedGalleryFile({ path: "obras/a/3.webp", createdAt: null }, used, now)).toBe(false);
  });

  it("acha as fotos usadas dentro das configurações", () => {
    const home = {
      hero: { title: "x", image: { path: "site/inicio/a.webp", alt: "Foto", width: 1, height: 1 } },
      editorialExample: null,
      howItWorks: { steps: [{ title: "path", text: "alt" }] },
    };
    expect([...imagePathsIn([home, { photo: { path: "site/sobre/b.webp", alt: "Carla" } }])]).toEqual([
      "site/inicio/a.webp",
      "site/sobre/b.webp",
    ]);
  });
});

describe("retenção das fotos dos clientes", () => {
  it("sem prazo, não apaga; com prazo, a data limite é N dias atrás", () => {
    expect(retentionCutoff(null, now)).toBeNull();
    expect(retentionCutoff(90, now)?.toISOString()).toBe("2026-08-16T12:00:00.000Z");
  });
});
