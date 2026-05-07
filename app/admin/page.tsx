/**
 * /admin — gateway protegido por senha.
 * Server component decide: se não autenticado, mostra o LoginForm.
 * Se autenticado, mostra o AdminDashboard com listagem.
 */

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminDashboard } from "./AdminDashboard";
import { LoginForm } from "./LoginForm";

// Auth state lê cookies → request-time → rota dinâmica
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) return <LoginForm />;
  return <AdminDashboard />;
}
