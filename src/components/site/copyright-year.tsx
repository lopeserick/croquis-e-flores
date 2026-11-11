import { cacheLife } from "next/cache";

// Com Cache Components, `new Date()` só pode rodar dentro de "use cache":
// o ano é calculado uma vez e revalidado diariamente.
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
