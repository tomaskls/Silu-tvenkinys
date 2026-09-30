// Datos saugomos kaip "YYYY-MM-DD" eilutės, kad nebūtų laiko juostų painiavos.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Šiandienos data Lietuvos laiku. */
export function todayLt(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vilnius" }).format(new Date());
}

export function diffDays(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function formatDate(isoDate: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("lt-LT", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  }).format(new Date(isoDate + "T00:00:00Z"));
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function pluralParos(n: number): string {
  // 1 para, 2–9 paros, 10–20 parų, 21 para...
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} para`;
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 11 || mod100 > 19)) return `${n} paros`;
  return `${n} parų`;
}
