// Administratoriaus sesija – pasirašytas JWT (HS256) httpOnly slapuke.
// Prisijungimo duomenys – ADMIN_USER ir ADMIN_PASSWORD aplinkos kintamuosiuose.
// Failas be "server-only", nes jį naudoja ir proxy.ts.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 d., sekundėmis
export const LOGIN_PATH = "/admin/prisijungti";

export function credentialsConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

export function checkCredentials(user: string, password: string): boolean {
  if (!credentialsConfigured()) return false;
  // Abu palyginimai atliekami visada, kad atsakymo laikas neišduotų, kuri dalis neteisinga
  const userOk = timingSafeEqual(user, process.env.ADMIN_USER!);
  const passwordOk = timingSafeEqual(password, process.env.ADMIN_PASSWORD!);
  return userOk && passwordOk;
}

async function sessionKey(): Promise<Uint8Array> {
  // Jei ADMIN_SESSION_SECRET nenustatytas, raktas išvedamas iš slaptažodžio ir DB adreso (jame – atsitiktinis
  // Neon slaptažodis). Pakeitus ADMIN_PASSWORD, visos esamos sesijos nustoja galioti.
  const secret = process.env.ADMIN_SESSION_SECRET || `${process.env.ADMIN_PASSWORD}:${process.env.DATABASE_URL}`;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)));
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(await sessionKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !credentialsConfigured()) return false;
  try {
    const { payload } = await jwtVerify(token, await sessionKey(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
