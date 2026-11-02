import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, LOGIN_PATH, SESSION_COOKIE, SESSION_MAX_AGE, verifySessionToken } from "@/lib/admin-session";

// proxy.ts tikrina tik puslapių užklausas, todėl puslapiai ir serverio veiksmai sesiją tikrina patys.

export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireAdminPage() {
  if (!(await isAdmin())) redirect(LOGIN_PATH);
}

export async function startAdminSession() {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
