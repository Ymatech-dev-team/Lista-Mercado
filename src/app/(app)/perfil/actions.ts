"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { deleteUserAccount, setMonthlyBudgetCents } from "@/db/users";
import { destroySession } from "@/lib/auth/session";
import { budgetCentsSchema } from "@/lib/validation/list";

export type DeleteState = { error?: string };

export async function deleteAccountAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "EXCLUIR") return { error: "Digite EXCLUIR (em maiúsculas) para confirmar." };

  const user = await requireUser();
  await deleteUserAccount(user.id); // cascata apaga tudo
  await destroySession();
  redirect("/");
}

// Define ou remove (null) o teto de gasto mensal. Valida no servidor sem coerção (RNF4). RF26.
export async function setBudgetAction(cents: number | null): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  if (cents !== null) {
    const parsed = budgetCentsSchema.safeParse(cents);
    if (!parsed.success) return { error: "Valor inválido." };
    await setMonthlyBudgetCents(user.id, parsed.data);
  } else {
    await setMonthlyBudgetCents(user.id, null);
  }
  revalidatePath("/inicio");
  revalidatePath("/perfil");
  return { ok: true };
}
