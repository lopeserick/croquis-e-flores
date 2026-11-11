import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Prévia padrão quando um link do site é colado no WhatsApp ou no Instagram.
// Páginas de obra e de coleção usam a própria foto (features/site/seo.ts).

export const alt = "Croquis e Flores: arte personalizada feita pela artista Carla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const photo = await readFile(join(process.cwd(), "public/demo/obras/croqui-vestido-rosa.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fbe4e1" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
            width: 660,
            padding: "0 72px",
            color: "#2d1b1f",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#a8324f" }}>
            Arte personalizada · Feita à mão
          </div>
          <div style={{ fontSize: 76, lineHeight: 1.02 }}>Croquis e Flores</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: "#5c4448" }}>
            Croquis de moda, retratos e ilustrações sob encomenda.
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
        <img src={photoSrc} alt="" width={540} height={630} style={{ objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}
