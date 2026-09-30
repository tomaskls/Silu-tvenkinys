// Paprasta HTTP Basic autentifikacija administratoriaus puslapiui.
// Prisijungimo duomenys – ADMIN_USER ir ADMIN_PASSWORD aplinkos kintamuosiuose.

export function isAdminAuthorized(authorizationHeader: string | null): boolean {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password || !authorizationHeader?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authorizationHeader.slice(6));
    const sep = decoded.indexOf(":");
    return timingSafeEqual(decoded.slice(0, sep), user) && timingSafeEqual(decoded.slice(sep + 1), password);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
