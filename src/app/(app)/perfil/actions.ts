"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { deleteUserAccount } from "@/db/users";
import { destroySession } from "@/lib/auth/session";

export type DeleteState = { error?: string };

export async function deleteAccountAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "EXCLUIR") return { error: "Digite EXCLUIR (em maiúsculas) para confirmar." };

  const user = await requireUser();
  await deleteUserAccount(user.id); // cascata apaga tudo
  await destroySession();
  redirect("/");
}
