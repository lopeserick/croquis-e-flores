"use server";

import { prepareUploads, submitOrder } from "./create-order";
import type { PrepareUploadsResult, SubmitOrderResult } from "./submission";

// Server Actions chamadas pelo configurador. O conteúdo vem do navegador e é
// tratado como não confiável: toda a validação está em create-order.ts.

export async function prepareReferenceUploads(input: unknown): Promise<PrepareUploadsResult> {
  return prepareUploads(input);
}

export async function sendOrder(input: unknown): Promise<SubmitOrderResult> {
  return submitOrder(input);
}
