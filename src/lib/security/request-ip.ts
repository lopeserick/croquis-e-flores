import "server-only";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { clientIp, hashIp } from "./ip-hash";

/** Hash do IP de quem fez a requisição (para limitar tentativas sem guardar o IP). */
export async function requestIpHash(): Promise<string> {
  return hashIp(clientIp(await headers()), getEnv("security").IP_HASH_SALT);
}
