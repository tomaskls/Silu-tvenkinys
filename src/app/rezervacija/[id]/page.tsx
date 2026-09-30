import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReservation } from "@/lib/reservations";
import { formatDate, formatMoney, pluralParos } from "@/lib/format";
import { site } from "@/content/site";
import { AutoRefresh } from "./auto-refresh";
import { retryPaymentAction } from "./actions";

export const metadata: Metadata = {
  title: "Rezervacijos būsena",
  robots: { index: false },
};

export default async function ReservationStatusPage(props: PageProps<"/rezervacija/[id]">) {
  const { id } = await props.params;
  const reservation = await getReservation(id);
  if (!reservation) notFound();

  const expired = reservation.status === "EXPIRED" || (reservation.status === "PENDING" && reservation.holdUntil < new Date());
  const status = reservation.status === "PAID" ? "paid" : reservation.status === "CANCELLED" ? "cancelled" : expired ? "expired" : "pending";

  const heading = {
    paid: "Rezervacija patvirtinta!",
    pending: "Laukiama apmokėjimo",
    expired: "Rezervacijos laikas baigėsi",
    cancelled: "Rezervacija atšaukta",
  }[status];

  const badge = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    expired: "bg-stone-200 text-stone-700",
    cancelled: "bg-red-100 text-red-800",
  }[status];

  return (
    <div className="container-page max-w-2xl py-16">
      {status === "pending" && <AutoRefresh />}
      <div className="rounded-3xl border border-pine-900/10 bg-white p-6 shadow-sm sm:p-10">
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${badge}`}>
          {{ paid: "Apmokėta", pending: "Neapmokėta", expired: "Nebegalioja", cancelled: "Atšaukta" }[status]}
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold text-pine-900 sm:text-4xl">{heading}</h1>

        {status === "paid" && (
          <p className="mt-3 text-pine-800">
            Ačiū, {reservation.customerName.split(" ")[0]}! Sektorius jūsų laukia. Atvykimas nuo {site.booking.checkInTime}.
          </p>
        )}
        {status === "pending" && (
          <p className="mt-3 text-pine-800">
            Jei jau apmokėjote, patvirtinimas gali užtrukti kelias sekundes – puslapis atsinaujins automatiškai.
          </p>
        )}
        {status === "expired" && (
          <p className="mt-3 text-pine-800">
            Apmokėjimas nebuvo gautas laiku, todėl sektorius atlaisvintas. Jei pinigai buvo nuskaičiuoti, susisiekite{" "}
            <a href={site.phoneHref} className="font-semibold underline">
              {site.phone}
            </a>
            .
          </p>
        )}

        <dl className="mt-8 divide-y divide-pine-900/10 border-y border-pine-900/10 text-sm">
          <Row label="Rezervacijos Nr." value={reservation.id.slice(-8).toUpperCase()} />
          <Row label="Sektorius" value={`Nr. ${reservation.sector.number}`} />
          <Row label="Atvykimas" value={`${formatDate(reservation.dateFrom)}, ${site.booking.checkInTime}`} />
          <Row label="Išvykimas" value={`${formatDate(reservation.dateTo)}, ${site.booking.checkOutTime}`} />
          <Row label="Trukmė" value={pluralParos(reservation.days)} />
          <Row label="Žvejų" value={String(reservation.anglers)} />
          <Row label="Suma" value={formatMoney(reservation.totalCents)} />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {status === "pending" && (
            <form action={retryPaymentAction.bind(null, reservation.id)}>
              <button className="rounded-full bg-wood-500 px-6 py-3 font-semibold text-white hover:bg-wood-600">
                Apmokėti
              </button>
            </form>
          )}
          {(status === "expired" || status === "cancelled") && (
            <Link href="/rezervacija" className="rounded-full bg-wood-500 px-6 py-3 font-semibold text-white hover:bg-wood-600">
              Rezervuoti iš naujo
            </Link>
          )}
          <Link href="/taisykles" className="rounded-full border border-pine-900/20 px-6 py-3 font-semibold text-pine-900 hover:bg-pine-50">
            Žvejybos taisyklės
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-pine-700">{label}</dt>
      <dd className="text-right font-semibold text-pine-900">{value}</dd>
    </div>
  );
}
