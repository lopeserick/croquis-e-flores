import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/features/admin/auth";
import { createSessionClient } from "@/lib/supabase/session";

// Foto de referência de um pedido. Só para a Carla logada: redireciona para um
// link assinado que vale 1 minuto. O endereço desta rota pode ficar no e-mail
// ou na página do pedido; o arquivo em si nunca tem endereço público.
// ?baixar=1 baixa o arquivo com o nome original.

const SIGNED_URL_SECONDS = 60;
const noStore = { "cache-control": "no-store" };

export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/referencias/[id]">) {
  const session = await getAdminSession();
  if (session.status !== "admin") {
    return new NextResponse("Acesso negado.", { status: session.status === "anonimo" ? 401 : 403, headers: noStore });
  }

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return new NextResponse("Foto não encontrada.", { status: 404, headers: noStore });

  // Com a sessão da Carla: o RLS também precisa permitir.
  const supabase = await createSessionClient();
  const { data: reference } = await supabase
    .from("order_references")
    .select("storage_path, original_name")
    .eq("id", id)
    .maybeSingle();
  if (!reference) return new NextResponse("Foto não encontrada.", { status: 404, headers: noStore });

  const download = request.nextUrl.searchParams.get("baixar") === "1";
  const { data, error } = await supabase.storage
    .from("referencias")
    .createSignedUrl(reference.storage_path, SIGNED_URL_SECONDS, download ? { download: reference.original_name } : {});
  if (error || !data) return new NextResponse("Não foi possível abrir a foto.", { status: 502, headers: noStore });

  return NextResponse.redirect(data.signedUrl, { status: 302, headers: noStore });
}
