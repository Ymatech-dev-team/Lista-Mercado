import { redirect } from "next/navigation";
import { getCurrentUser } from "./current-user";

// Garante usuário logado; se não, manda pro login. Use em páginas/ações protegidas.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}
