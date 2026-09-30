import { notFound } from "next/navigation";
import { mockPayAction } from "./actions";
import { getReservation } from "@/lib/reservations";
import { mockPaymentsAllowed } from "@/lib/payments";
import { formatMoney } from "@/lib/format";

// Testinis mokėjimo puslapis – naudojamas, kol neprijungtas Montonio.
// Produkcijoje išjungtas (nebent ALLOW_MOCK_PAYMENTS=true).

export default async function MockPaymentPage(props: PageProps<"/mokejimas/testas/[id]">) {
  if (!mockPaymentsAllowed()) notFound();
  const { id } = await props.params;
  const reservation = await getReservation(id);
  if (!reservation) notFound();

  return (
    <div className="container-page max-w-lg py-20">
      <div className="rounded-3xl border-2 border-dashed border-amber-400 bg-amber-50 p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Testinis mokėjimas</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-pine-900">{formatMoney(reservation.totalCents)}</h1>
        <p className="mt-3 text-sm text-pine-800">
          Montonio dar neprijungtas. Šis puslapis imituoja banko apmokėjimą – realūs pinigai nenuskaičiuojami.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <form action={mockPayAction.bind(null, id)}>
            <button className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
              Apmokėti (testas)
            </button>
          </form>
          <a href={`/rezervacija/${id}`} className="rounded-full border border-pine-900/20 px-6 py-3 font-semibold">
            Atšaukti
          </a>
        </div>
      </div>
    </div>
  );
}
