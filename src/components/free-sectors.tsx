import { prisma } from "@/lib/db";
import { addDays, formatMoney } from "@/lib/format";
import { getFreeSectorNumbers } from "@/lib/reservations";

/**
 * Šiandien, rytoj ir artimiausias penktadienis bei šeštadienis. Penktadienį ir šeštadienį –
 * kitos savaitės; rytojaus nekartojame (ketvirtadienį „Rytoj“ jau yra penktadienis).
 */
function highlightDays(today: string): { label: string; date: string }[] {
  const wd = (new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7; // pirmadienis – 0
  const weekend = wd === 4 || wd === 5;
  const friday = addDays(today, weekend ? 11 - wd : (11 - wd) % 7);
  const days = [
    { label: "Šiandien", date: today },
    { label: "Rytoj", date: addDays(today, 1) },
    { label: weekend ? "Kitą penktadienį" : "Penktadienį", date: friday },
    { label: weekend ? "Kitą šeštadienį" : "Šeštadienį", date: addDays(friday, 1) },
  ];
  return days.filter((d, i) => days.findIndex((x) => x.date === d.date) === i);
}

/** Laisvų sektorių numeriai artimiausiomis dienomis ir kaina – tamsiam fonui (antraštėms ant nuotraukos). */
export async function FreeSectors({ today }: { today: string }) {
  const days = highlightDays(today);
  const [cheapest, free] = await Promise.all([
    prisma.sector.findFirst({ where: { active: true }, orderBy: { pricePerDay: "asc" } }),
    getFreeSectorNumbers(days.map((d) => d.date)),
  ]);

  return (
    <div className="mt-6 text-sm text-pine-100/80">
      <p className="font-semibold text-white">Laisvi sektoriai:</p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        {days.map((d) => (
          <div key={d.date} className="contents">
            <dt>{d.label}</dt>
            <dd className="font-semibold text-white">{free[d.date].length > 0 ? free[d.date].join(", ") : "nėra"}</dd>
          </div>
        ))}
      </dl>
      {cheapest && (
        <p className="mt-3">
          Žvejybos kaina – {formatMoney(cheapest.pricePerDay, { trailingZeroDisplay: "stripIfInteger" })} para
        </p>
      )}
    </div>
  );
}
