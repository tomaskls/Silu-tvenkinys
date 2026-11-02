import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { addDays, diffDays, formatDateRange, isIsoDate, todayLt } from "@/lib/format";
import { site } from "@/content/site";

/** Persidengimas: [from, to) ∩ [dateFrom, dateTo) ≠ ∅ */
function overlapWhere(from: string, to: string): Prisma.ReservationWhereInput {
  return { dateFrom: { lt: to }, dateTo: { gt: from } };
}

/** Viešai rodomo užimtumo intervalo patikra. */
export function validateRange(from: string, days: number): string | null {
  if (!isIsoDate(from)) return "Neteisinga data.";
  if (!Number.isInteger(days) || days < 1 || days > site.booking.maxDays)
    return `Galima pasirinkti nuo 1 iki ${site.booking.maxDays} parų.`;
  const today = todayLt();
  if (from < today) return "Rodomas tik būsimų dienų užimtumas.";
  if (diffDays(today, from) > site.booking.bookingWindowDays)
    return `Užimtumas rodomas ne daugiau kaip ${site.booking.bookingWindowDays} d. į priekį.`;
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
    include: { reservations: { where: overlapWhere(from, to), select: { id: true } } },
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
      where: { ...overlapWhere(from, to), sector: { active: true } },
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

// ── Administravimas ───────────────────────────────────────────────────────────

/** Rezervacija su kliento duomenimis – tik administratoriui. */
export type AdminReservation = {
  id: string;
  sectorId: number;
  sectorNumber: number;
  dateFrom: string;
  dateTo: string;
  customerName: string;
  customerPhone: string;
  notes: string;
};

const adminSelect = {
  id: true,
  sectorId: true,
  dateFrom: true,
  dateTo: true,
  customerName: true,
  customerPhone: true,
  notes: true,
  sector: { select: { number: true } },
} satisfies Prisma.ReservationSelect;

function toAdminReservation({ sector, ...r }: Prisma.ReservationGetPayload<{ select: typeof adminSelect }>): AdminReservation {
  return { ...r, sectorNumber: sector.number };
}

/** Rezervacijos, užimančios bent vieną dieną intervale [from, to). */
export async function getReservationsBetween(from: string, to: string): Promise<AdminReservation[]> {
  const rows = await prisma.reservation.findMany({
    where: overlapWhere(from, to),
    orderBy: [{ dateFrom: "asc" }, { sector: { number: "asc" } }],
    select: adminSelect,
  });
  return rows.map(toAdminReservation);
}

/** Dabartinės ir būsimos rezervacijos (dar neišvykę). */
export async function getUpcomingReservations(today: string, take = 300): Promise<AdminReservation[]> {
  const rows = await prisma.reservation.findMany({
    where: { dateTo: { gt: today } },
    orderBy: [{ dateFrom: "asc" }, { sector: { number: "asc" } }],
    select: adminSelect,
    take,
  });
  return rows.map(toAdminReservation);
}

export const MAX_RESERVATION_DAYS = 60;

export const reservationInputSchema = z.object({
  // Nėra – kuriama nauja (po vieną kiekvienam sektoriui), yra – redaguojama esama
  id: z.string().min(1).optional(),
  sectorIds: z.array(z.number().int().positive()).min(1, "Pasirinkite bent vieną sektorių.").max(100),
  dateFrom: z.string().refine(isIsoDate, "Neteisinga atvykimo data."),
  days: z
    .number({ message: "Įveskite parų skaičių." })
    .int()
    .min(1, "Mažiausiai 1 para.")
    .max(MAX_RESERVATION_DAYS, `Daugiausiai ${MAX_RESERVATION_DAYS} parų.`),
  customerName: z.string().trim().max(100),
  customerPhone: z.string().trim().max(30),
  notes: z.string().trim().max(1000),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export class ReservationError extends Error {}

export async function saveReservation(input: ReservationInput) {
  const sectorIds = [...new Set(input.sectorIds)];
  if (input.id && sectorIds.length !== 1) throw new ReservationError("Redaguojant galima pasirinkti tik vieną sektorių.");

  const dateTo = addDays(input.dateFrom, input.days);
  const data = {
    dateFrom: input.dateFrom,
    dateTo,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    notes: input.notes,
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        const found = await tx.sector.count({ where: { id: { in: sectorIds } } });
        if (found !== sectorIds.length) throw new ReservationError("Sektorius nerastas.");

        const conflicts = await tx.reservation.findMany({
          where: {
            sectorId: { in: sectorIds },
            ...(input.id && { id: { not: input.id } }),
            ...overlapWhere(input.dateFrom, dateTo),
          },
          orderBy: [{ sector: { number: "asc" } }, { dateFrom: "asc" }],
          select: adminSelect,
        });
        if (conflicts.length > 0) {
          throw new ReservationError(
            conflicts
              .map(toAdminReservation)
              .map(
                (c) =>
                  `Sektorius Nr. ${c.sectorNumber} jau užimtas ${formatDateRange(c.dateFrom, c.dateTo)}${c.customerName ? ` (${c.customerName})` : ""}.`,
              )
              .join(" "),
          );
        }

        if (input.id) {
          await tx.reservation.update({ where: { id: input.id }, data: { ...data, sectorId: sectorIds[0] } });
        } else {
          await tx.reservation.createMany({ data: sectorIds.map((sectorId) => ({ ...data, sectorId })) });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof ReservationError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") throw new ReservationError("Rezervacija nerasta – galbūt ji jau ištrinta.");
      // Lygiagretus pakeitimas (pvz. kitame įrenginyje tuo pat metu užimtas tas pats sektorius)
      if (e.code === "P2034" || e.code === "P1008")
        throw new ReservationError("Užimtumas ką tik pasikeitė. Bandykite dar kartą.");
    }
    throw e;
  }
}

export async function deleteReservation(id: string) {
  await prisma.reservation.deleteMany({ where: { id } });
}
