import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney, todayLt } from "@/lib/format";
import { setReservationStatusAction } from "./actions";

export const metadata: Metadata = { title: "Administravimas", robots: { index: false } };

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PAID: { label: "Apmokėta", className: "bg-emerald-100 text-emerald-800" },
  PENDING: { label: "Laukia", className: "bg-amber-100 text-amber-800" },
  CANCELLED: { label: "Atšaukta", className: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Nebegalioja", className: "bg-stone-200 text-stone-700" },
};

export default async function AdminPage(props: PageProps<"/admin">) {
  await connection();
  const { rodyti } = await props.searchParams;
  const showAll = rodyti === "visos";
  const today = todayLt();
  const now = new Date();

  const reservations = await prisma.reservation.findMany({
    where: showAll ? {} : { dateTo: { gt: today }, status: { in: ["PAID", "PENDING"] } },
    orderBy: [{ dateFrom: "asc" }, { sector: { number: "asc" } }],
    include: { sector: true },
    take: 500,
  });

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pine-900">Rezervacijos</h1>
          <p className="mt-1 text-sm text-pine-700">
            {showAll ? "Visos rezervacijos" : "Aktyvios ir būsimos rezervacijos"} · {reservations.length}
          </p>
        </div>
        <Link href={showAll ? "/admin" : "/admin?rodyti=visos"} className="text-sm font-semibold text-lake-700 underline">
          {showAll ? "Rodyti tik aktyvias" : "Rodyti visas"}
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-pine-900/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-sand-100 text-pine-800">
            <tr>
              <th className="px-4 py-3">Datos</th>
              <th className="px-4 py-3">Sekt.</th>
              <th className="px-4 py-3">Klientas</th>
              <th className="px-4 py-3">Žvejų</th>
              <th className="px-4 py-3">Suma</th>
              <th className="px-4 py-3">Būsena</th>
              <th className="px-4 py-3">Veiksmai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-900/10">
            {reservations.map((r) => {
              const status = r.status === "PENDING" && r.holdUntil < now ? "EXPIRED" : r.status;
              const s = STATUS_LABELS[status] ?? STATUS_LABELS.PENDING;
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(r.dateFrom, { month: "short" })} – {formatDate(r.dateTo, { month: "short" })}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.sector.number}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.customerName}</p>
                    <p className="text-pine-700">
                      <a href={`tel:${r.customerPhone}`}>{r.customerPhone}</a> ·{" "}
                      <a href={`mailto:${r.customerEmail}`}>{r.customerEmail}</a>
                    </p>
                    {r.notes && <p className="mt-1 text-pine-700 italic">„{r.notes}“</p>}
                  </td>
                  <td className="px-4 py-3">{r.anglers}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatMoney(r.totalCents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
                    {r.paymentProvider && <p className="mt-1 text-xs text-pine-700">{r.paymentProvider}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "PAID" && (
                        <form action={setReservationStatusAction.bind(null, r.id, "PAID")}>
                          <button className="rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                            Pažymėti apmokėta
                          </button>
                        </form>
                      )}
                      {r.status !== "CANCELLED" && (
                        <form action={setReservationStatusAction.bind(null, r.id, "CANCELLED")}>
                          <button className="rounded-full border border-red-600 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                            Atšaukti
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-pine-700">
                  Rezervacijų nėra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
