import type { Metadata } from "next";
import { connection } from "next/server";
import { getDailyFreeCounts, getSectorAvailability } from "@/lib/reservations";
import { addDays, todayLt } from "@/lib/format";
import { site } from "@/content/site";
import { PageHeader } from "@/components/page-header";
import { FreeSectors } from "@/components/free-sectors";
import { OccupancyView } from "./occupancy-view";

export const metadata: Metadata = {
  title: "Sektorių užimtumas",
  description: `Pasižiūrėkite, kurie Šilų (Bridų) tvenkinio sektoriai laisvi, ir rezervuokite telefonu ${site.phone}.`,
};

export default async function OccupancyPage() {
  await connection();
  const today = todayLt();
  const month = today.slice(0, 7);
  const monthStart = `${month}-01`;
  const daysInMonth = Number(addDays(addDays(monthStart, 32).slice(0, 8) + "01", -1).slice(8, 10));

  const [sectors, monthCounts] = await Promise.all([
    getSectorAvailability(today, 1),
    getDailyFreeCounts(monthStart, daysInMonth),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Rezervacija telefonu"
        title="Sektorių užimtumas"
        intro={`Pasirinkite datą ir pažiūrėkite, kurie sektoriai laisvi. Rezervuoti galima telefonu ${site.phone}. Para – nuo ${site.booking.checkInTime} iki ${site.booking.checkOutTime} kitą dieną.`}
        image="/images/sektorius-2.jpg"
      >
        <FreeSectors today={today} />
      </PageHeader>
      <div className="container-page py-12">
        <OccupancyView
          today={today}
          initialMonth={month}
          initialMonthCounts={monthCounts}
          initialSectors={sectors}
          maxDays={site.booking.maxDays}
          bookingWindowDays={site.booking.bookingWindowDays}
        />
      </div>
    </>
  );
}
