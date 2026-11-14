"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { FormState } from "@/features/admin/forms";

/**
 * Envia o formulário para a Server Action sem limpar os campos: com
 * `<form action>` o React apaga o que foi digitado depois do envio, e num erro
 * de validação a Carla perderia o texto. Depois de um erro, o foco vai para o
 * primeiro campo com problema.
 */
export function useFormAction(action: (previous: FormState, data: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  // Formulário do último envio (para levar o foco ao campo com erro).
  const lastForm = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state && !state.ok && state.errors) {
      lastForm.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    }
  }, [state]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    lastForm.current = event.currentTarget;
    // O botão clicado entra nos dados (ex.: name="status" value="publicada").
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(data));
  };

  return { state, pending, onSubmit, error: (name: string) => state?.errors?.[name] };
}
