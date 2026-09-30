import type { Metadata } from "next";
import { connection } from "next/server";
import { getDailyFreeCounts, getSectorAvailability } from "@/lib/reservations";
import { addDays, todayLt } from "@/lib/format";
import { site } from "@/content/site";
import { PageHeader } from "@/components/page-header";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "Sektorių rezervacija",
  description: "Rezervuokite žvejybos sektorių Šilų (Bridų) tvenkinyje internetu.",
};

export default async function BookingPage() {
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
        eyebrow="Rezervacija"
        title="Rezervuokite sektorių"
        intro={`Pasirinkite atvykimo dieną, parų skaičių ir laisvą sektorių. Para – nuo ${site.booking.checkInTime} iki ${site.booking.checkOutTime} kitą dieną.`}
        image="/images/sektorius-2.jpg"
      />
      <div className="container-page py-12">
        <BookingForm
          today={today}
          initialMonth={month}
          initialMonthCounts={monthCounts}
          initialSectors={sectors}
          maxDays={site.booking.maxDays}
          bookingWindowDays={site.booking.bookingWindowDays}
          holdMinutes={site.booking.holdMinutes}
        />
      </div>
    </>
  );
}
