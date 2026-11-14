// Onde ficam as fotos da galeria.
//
// No banco, cada foto guarda um caminho:
//   - "/demo/obras/x.jpg": arquivo da pasta public/ (dados provisórios);
//   - "obras/<id>/abc.webp": arquivo enviado pelo painel ao bucket público "obras".
// O endereço completo é montado só na hora de exibir, assim o mesmo banco
// funciona em desenvolvimento e em produção (cada um com o seu Supabase).

export const GALLERY_BUCKET = "obras";

/** Pastas do bucket "obras" que o painel pode usar. */
export const GALLERY_FOLDERS = ["obras", "colecoes", "modalidades", "site"] as const;
export type GalleryFolder = (typeof GALLERY_FOLDERS)[number];

/** Caminho guardado no banco → endereço que o navegador abre. */
export function resolveImagePath(
  path: string,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  if (path.startsWith("/") || /^https?:\/\//.test(path)) return path;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada: não dá para montar o endereço da foto.");
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${GALLERY_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Foto enviada pelo painel (e não da pasta public/): pode ser apagada do bucket. */
export const isStoredImagePath = (path: string) => !path.startsWith("/") && !/^https?:\/\//.test(path);
