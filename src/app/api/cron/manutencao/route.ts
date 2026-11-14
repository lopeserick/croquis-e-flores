import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/features/maintenance/rules";
import { runMaintenance } from "@/features/maintenance/run";
import { getEnv } from "@/lib/env";

// Rotina diária de manutenção, chamada pela Vercel Cron (vercel.json).
// A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem isso, 401.
// Para rodar à mão (desenvolvimento):
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/manutencao

export const maxDuration = 60;

const noStore = { "cache-control": "no-store" };

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = getEnv("security");
  if (!isAuthorizedCron(request.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 401, headers: noStore });
  }
  const report = await runMaintenance();
  console.info("[manutenção]", JSON.stringify(report));
  return NextResponse.json(report, { headers: noStore });
}
