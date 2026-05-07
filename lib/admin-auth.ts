/**
 * Auth simples do /admin.
 *
 * Modelo: cookie HttpOnly com o valor da senha. A cada request, comparamos
 * o cookie contra ADMIN_PASSWORD do env. Sem JWT, sem sessão em DB —
 * é uma festa de aniversário, não banco. A senha NUNCA chega ao cliente
 * (cookie é httpOnly), e o nome ADMIN_PASSWORD não tem prefixo
 * NEXT_PUBLIC_ — server-only, não vaza no bundle.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "ju-admin";

/** Tempo de vida do cookie: 7 dias (suficiente pra todo o ciclo da festa). */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Verifica se o request atual tem o cookie de admin válido.
 * Usar em route handlers e server components.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.warn("[admin] ADMIN_PASSWORD ausente — admin desabilitado");
    return false;
  }
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  return cookie?.value === expected;
}

/** Define o cookie após login OK. Só funciona em route handlers / server functions. */
export async function setAdminCookie(): Promise<void> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD não configurada");
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: expected,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Apaga o cookie (logout). */
export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
