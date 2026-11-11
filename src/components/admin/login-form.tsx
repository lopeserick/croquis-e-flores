"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/button-link";
import { TextField } from "@/components/ui/fields";
import { signIn, type LoginState } from "@/features/admin/auth-actions";

const initial: LoginState = { error: null, email: "" };

export function LoginForm({ notice }: { notice: string | null }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const message = state.error ?? notice;
  return (
    <form action={action} className="flex flex-col gap-5">
      {message && (
        <p role="alert" className="rounded-xl border-2 border-rose bg-white px-4 py-3 text-[15px]">
          {message}
        </p>
      )}
      <TextField
        id="email"
        name="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={state.email}
      />
      <TextField id="senha" name="password" label="Senha" type="password" autoComplete="current-password" required />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClasses("primary")} w-full disabled:cursor-wait disabled:opacity-70`}
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
