import { NextResponse } from "next/server";
import { getDailyFreeCounts, getSectorAvailability, validateRange } from "@/lib/reservations";
import { addDays, isIsoDate } from "@/lib/format";

// GET /api/availability?from=2026-10-01&days=2          → sektorių užimtumas pasirinktam laikotarpiui
// GET /api/availability?month=2026-10                   → laisvų sektorių skaičius kiekvienai mėnesio dienai
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const month = params.get("month");
  if (month) {
    const first = `${month}-01`;
    if (!isIsoDate(first)) return NextResponse.json({ error: "Neteisingas mėnuo" }, { status: 400 });
    const daysInMonth = Number(addDays(addDays(first, 32).slice(0, 8) + "01", -1).slice(8, 10));
    return NextResponse.json({ days: await getDailyFreeCounts(first, daysInMonth) });
  }

  const from = params.get("from") ?? "";
  const days = Number(params.get("days") ?? "1");
  const error = validateRange(from, days);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ sectors: await getSectorAvailability(from, days) });
}
