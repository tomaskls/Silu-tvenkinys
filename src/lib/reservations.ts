import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { addDays, diffDays, isIsoDate, todayLt } from "@/lib/format";
import { site } from "@/content/site";

/** Rezervacija užima sektorių, jei ji apmokėta arba dar galioja apmokėjimo laikas. */
function activeReservationWhere(now = new Date()): Prisma.ReservationWhereInput {
  return {
    OR: [{ status: "PAID" }, { status: "PENDING", holdUntil: { gt: now } }],
  };
}

/** Persidengimas: [from, to) ∩ [dateFrom, dateTo) ≠ ∅ */
function overlapWhere(from: string, to: string): Prisma.ReservationWhereInput {
  return { dateFrom: { lt: to }, dateTo: { gt: from } };
}

export function validateRange(from: string, days: number): string | null {
  if (!isIsoDate(from)) return "Neteisinga data.";
  if (!Number.isInteger(days) || days < 1 || days > site.booking.maxDays)
    return `Galima rezervuoti nuo 1 iki ${site.booking.maxDays} parų.`;
  const today = todayLt();
  if (from < today) return "Negalima rezervuoti praėjusių dienų.";
  if (diffDays(today, from) > site.booking.bookingWindowDays)
    return `Rezervuoti galima ne daugiau kaip ${site.booking.bookingWindowDays} d. į priekį.`;
  return null;
}

export type SectorAvailability = {
  id: number;
  number: number;
  name: string;
  description: string;
  image: string | null;
  pricePerDay: number;
  maxAnglers: number;
  available: boolean;
};

export async function getSectorAvailability(from: string, days: number): Promise<SectorAvailability[]> {
  const to = addDays(from, days);
  const sectors = await prisma.sector.findMany({
    where: { active: true },
    orderBy: { number: "asc" },
    include: {
      reservations: {
        where: { AND: [activeReservationWhere(), overlapWhere(from, to)] },
        select: { id: true },
      },
    },
  });
  return sectors.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    description: s.description,
    image: s.image,
    pricePerDay: s.pricePerDay,
    maxAnglers: s.maxAnglers,
    available: s.reservations.length === 0,
  }));
}

/** Kiek sektorių laisva kiekvieną dieną nurodytame intervale (kalendoriui). */
export async function getDailyFreeCounts(from: string, days: number): Promise<Record<string, number>> {
  const to = addDays(from, days);
  const [sectorCount, reservations] = await Promise.all([
    prisma.sector.count({ where: { active: true } }),
    prisma.reservation.findMany({
      where: { AND: [activeReservationWhere(), overlapWhere(from, to), { sector: { active: true } }] },
      select: { dateFrom: true, dateTo: true },
    }),
  ]);
  const result: Record<string, number> = {};
  for (let i = 0; i < days; i++) result[addDays(from, i)] = sectorCount;
  for (const r of reservations) {
    for (let d = r.dateFrom; d < r.dateTo; d = addDays(d, 1)) {
      if (d in result) result[d]--;
    }
  }
  return result;
}

export const reservationInputSchema = z.object({
  sectorId: z.coerce.number().int().positive(),
  dateFrom: z.string().refine(isIsoDate, "Neteisinga data"),
  days: z.coerce.number().int().min(1).max(site.booking.maxDays),
  anglers: z.coerce.number().int().min(1).max(10),
  customerName: z.string().trim().min(2, "Įveskite vardą ir pavardę").max(100),
  customerEmail: z.string().trim().email("Neteisingas el. pašto adresas").max(200),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,20}$/, "Neteisingas telefono numeris"),
  notes: z.string().trim().max(1000).default(""),
  acceptRules: z.literal("on", { message: "Būtina sutikti su žvejybos taisyklėmis" }),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export class ReservationError extends Error {}

export async function createPendingReservation(input: ReservationInput) {
  const rangeError = validateRange(input.dateFrom, input.days);
  if (rangeError) throw new ReservationError(rangeError);

  const dateTo = addDays(input.dateFrom, input.days);
  const holdUntil = new Date(Date.now() + site.booking.holdMinutes * 60_000);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const sector = await tx.sector.findFirst({ where: { id: input.sectorId, active: true } });
        if (!sector) throw new ReservationError("Sektorius nerastas.");
        if (input.anglers > sector.maxAnglers)
          throw new ReservationError(`Šiame sektoriuje gali žvejoti ne daugiau kaip ${sector.maxAnglers} žvejai.`);

        const conflict = await tx.reservation.findFirst({
          where: { sectorId: sector.id, AND: [activeReservationWhere(), overlapWhere(input.dateFrom, dateTo)] },
          select: { id: true },
        });
        if (conflict) throw new ReservationError("Deja, šis sektorius pasirinktomis dienomis jau užimtas.");

        return tx.reservation.create({
          data: {
            sectorId: sector.id,
            dateFrom: input.dateFrom,
            dateTo,
            days: input.days,
            anglers: input.anglers,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            notes: input.notes,
            totalCents: sector.pricePerDay * input.days,
            holdUntil,
          },
          include: { sector: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof ReservationError) throw e;
    // Lygiagretus konfliktas (kitas žvejys tuo pat metu rezervavo tą patį sektorių)
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2034" || e.code === "P1008"))
      throw new ReservationError("Sektorius ką tik buvo užimtas. Pabandykite dar kartą.");
    throw e;
  }
}

/** Pažymi rezervaciją apmokėta. Kartotinis kvietimas (pvz. pakartotinis webhook) nieko nekeičia. */
export async function markReservationPaid(id: string, provider: string, paymentOrderId?: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return null;
  if (reservation.status === "PAID") return reservation;
  // Jei apmokėjimo laikas pasibaigė, bet sumokėta – vis tiek patvirtiname, nebent sektorių jau užėmė kitas.
  // Tokį atvejį administratorius mato sąraše (status PAID + persidengimas) ir sprendžia rankiniu būdu.
  return prisma.reservation.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date(), paymentProvider: provider, paymentOrderId },
  });
}

export async function getReservation(id: string) {
  return prisma.reservation.findUnique({ where: { id }, include: { sector: true } });
}

export function defaultBookingDate(): string {
  return todayLt();
}
