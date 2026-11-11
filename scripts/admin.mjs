// Contas do painel (o cadastro público é desligado: só por aqui).
//
//   npm run admin -- criar email@exemplo.com "Nome"   cria a conta e dá acesso ao painel
//   npm run admin -- senha email@exemplo.com          troca a senha
//   npm run admin -- remover email@exemplo.com        tira o acesso e apaga a conta
//
// A senha é digitada no terminal, sem aparecer na tela, e nunca é gravada em arquivo.
// Usa o projeto do .env.local (desenvolvimento). Em produção, rode com as chaves de produção.

import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const MIN_PASSWORD = 12;

/** Pergunta sem mostrar o que é digitado. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function askPassword() {
  const password = await askHidden(`Senha (mínimo ${MIN_PASSWORD} caracteres): `);
  if (password.length < MIN_PASSWORD) throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  const again = await askHidden("Repita a senha: ");
  if (again !== password) throw new Error("As senhas não conferem.");
  return password;
}

async function findUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user || data.users.length < 200) return user ?? null;
  }
}

const [command, email, name] = process.argv.slice(2);

try {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Informe um e-mail válido.");

  if (command === "criar") {
    if (!name) throw new Error('Informe o nome, entre aspas: npm run admin -- criar email "Nome"');
    const existing = await findUser(email);
    let userId = existing?.id;
    if (existing) {
      console.log("Essa conta já existe: só vou dar acesso ao painel (a senha continua a mesma).");
    } else {
      const password = await askPassword();
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      userId = data.user.id;
    }
    const { error } = await db.from("admin_users").upsert({ user_id: userId, name });
    if (error) throw error;
    console.log(`Pronto: ${email} entra no painel em /admin/login.`);
  } else if (command === "senha") {
    const user = await findUser(email);
    if (!user) throw new Error("Não existe conta com esse e-mail.");
    const password = await askPassword();
    const { error } = await db.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;
    console.log("Senha trocada.");
  } else if (command === "remover") {
    const user = await findUser(email);
    if (!user) throw new Error("Não existe conta com esse e-mail.");
    const { error } = await db.auth.admin.deleteUser(user.id); // admin_users sai junto (cascade)
    if (error) throw error;
    console.log("Conta removida.");
  } else {
    throw new Error("Use: criar, senha ou remover. Exemplo: npm run admin -- criar email@exemplo.com \"Nome\"");
  }
} catch (error) {
  console.error(`Erro: ${error.message}`);
  process.exit(1);
}
