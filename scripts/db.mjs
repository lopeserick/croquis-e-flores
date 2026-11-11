// Roda a CLI do Supabase com as variáveis do .env.local (senha do banco),
// sem precisar exportá-las no terminal. Uso: node scripts/db.mjs <args da CLI>
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// shell: no Windows o npx é um .cmd. Os argumentos vêm só dos scripts do package.json.
const command = ["npx", "supabase", ...process.argv.slice(2)].join(" ");
const { status } = spawnSync(command, { stdio: "inherit", shell: true });
process.exit(status ?? 1);
