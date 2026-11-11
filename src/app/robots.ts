import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = getEnv("site").NEXT_PUBLIC_SITE_URL;
  return {
    // Painel e rotas internas não aparecem em buscadores.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
