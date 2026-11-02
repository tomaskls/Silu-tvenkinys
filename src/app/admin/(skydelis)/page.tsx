import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { getReservationsBetween, getUpcomingReservations, MAX_RESERVATION_DAYS } from "@/lib/reservations";
import { addDays, isIsoDate, todayLt } from "@/lib/format";
import { ReservationsBoard } from "./reservations-board";

export const metadata: Metadata = { title: "Užimtumas", robots: { index: false } };

// Kiek dienų rodoma užimtumo lentelėje
const BOARD_DAYS = 14;

export default async function AdminPage(props: PageProps<"/admin">) {
  await requireAdminPage();
  const { nuo } = await props.searchParams;
  const today = todayLt();
  const start = typeof nuo === "string" && isIsoDate(nuo) ? nuo : today;

  const [sectors, reservations, upcoming] = await Promise.all([
    prisma.sector.findMany({ where: { active: true }, orderBy: { number: "asc" }, select: { id: true, number: true } }),
    getReservationsBetween(start, addDays(start, BOARD_DAYS)),
    getUpcomingReservations(today),
  ]);

  return (
    <ReservationsBoard
      today={today}
      start={start}
      days={BOARD_DAYS}
      sectors={sectors}
      reservations={reservations}
      upcoming={upcoming}
      maxDays={MAX_RESERVATION_DAYS}
    />
  );
}
