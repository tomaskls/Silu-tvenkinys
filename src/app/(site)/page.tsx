import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { formatDate, todayLt } from "@/lib/format";
import { pondFacts, site } from "@/content/site";
import { CatchCard } from "@/components/catch-card";
import { FreeSectors } from "@/components/free-sectors";

export default async function HomePage() {
  await connection();
  const today = todayLt();
  const [catches, competitions] = await Promise.all([
    prisma.catchPhoto.findMany({ where: { published: true }, orderBy: { date: "desc" }, take: 3 }),
    prisma.competition.findMany({
      where: { published: true, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 2,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-pine-950">
        <Image
          src="/images/tvenkinys-is-virsaus.jpg"
          alt="Šilų (Bridų) tvenkinys iš paukščio skrydžio"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-pine-950/85 via-pine-950/55 to-pine-950/10" />
        <div className="container-page py-24 sm:py-36">
          <p className="text-sm font-semibold uppercase tracking-widest text-wood-400">Limituota karpių žūklė</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-semibold leading-tight text-white sm:text-6xl">
            {site.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-pine-100">
            {site.tagline}. Pasižiūrėkite, kurie sektoriai laisvi, ir rezervuokite telefonu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rezervacija"
              className="rounded-full bg-wood-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-wood-600"
            >
              Sektorių užimtumas
            </Link>
            <a
              href={site.phoneHref}
              className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Skambinti {site.phone}
            </a>
          </div>
          <FreeSectors today={today} />
        </div>
      </section>

      {/* Faktai */}
      <section className="border-b border-pine-900/10 bg-white">
        <dl className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {pondFacts.map((f) => (
            <div key={f.label}>
              <dt className="text-sm text-pine-700">{f.label}</dt>
              <dd className="font-display text-2xl font-semibold text-pine-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Kaip rezervuoti */}
      <section className="container-page py-16 sm:py-20">
        <h2 className="font-display text-3xl font-semibold text-pine-900">Kaip rezervuoti?</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { t: "Pasižiūrėkite užimtumą", d: "Kalendoriuje ir žemėlapyje matysite, kurie sektoriai norimomis dienomis laisvi." },
            { t: "Paskambinkite", d: `Skambinkite ${site.phone} ir pasakykite sektorių bei datas.` },
            { t: "Atvykite žvejoti", d: `Rezervaciją pažymime iš karto – sektorius jūsų laukia nuo ${site.booking.checkInTime}.` },
          ].map((step, i) => (
            <li key={step.t} className="rounded-2xl border border-pine-900/10 bg-white p-6">
              <span className="grid size-10 place-items-center rounded-full bg-pine-100 font-display text-lg font-semibold text-pine-900">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-pine-900">{step.t}</h3>
              <p className="mt-1 text-pine-800">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Apie trumpai */}
      <section className="bg-pine-900 text-white">
        <div className="container-page grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
            <Image
              src="/images/laimikiai/129.jpg"
              alt="Tvenkinio rekordas – karpis, sveriantis daugiau nei 20 kg"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-wood-500 px-3 py-1 text-sm font-semibold text-white">
              Rekordas: 20+ kg
            </span>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">Ramybė, lieptai ir trofėjiniai karpiai</h2>
            <p className="mt-4 leading-relaxed text-pine-100">
              Aplink tvenkinį įrengta 10 sektorių su mediniais lieptais. Kiekvienas sektorius – atskira erdvė palapinei,
              kėdėms ir įrangai. Tvenkinyje sugauti karpiai, sveriantys daugiau nei 20 kg.
            </p>
            <Link href="/apie" className="mt-6 inline-block font-semibold text-wood-400 hover:text-wood-100">
              Plačiau apie tvenkinį →
            </Link>
          </div>
        </div>
      </section>

      {/* Laimikiai */}
      {catches.length > 0 && (
        <section className="container-page py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold text-pine-900">Naujausi laimikiai</h2>
            <Link href="/galerija" className="font-semibold text-lake-600 hover:text-lake-700">
              Visa galerija →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catches.map((c) => (
              <CatchCard key={c.id} photo={c} />
            ))}
          </div>
        </section>
      )}

      {/* Varžybos */}
      <section className="container-page pb-4">
        <div className="rounded-3xl bg-lake-100 p-8 sm:p-12">
          <h2 className="font-display text-3xl font-semibold text-pine-900">Artėjančios varžybos</h2>
          {competitions.length === 0 ? (
            <p className="mt-4 text-pine-800">Šiuo metu suplanuotų varžybų nėra. Sekite naujienas!</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {competitions.map((c) => (
                <li key={c.id} className="rounded-2xl bg-white p-6">
                  <p className="text-sm font-semibold text-lake-700">{formatDate(c.date)}</p>
                  <p className="mt-1 text-lg font-semibold text-pine-900">{c.title}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/varzybos" className="mt-6 inline-block font-semibold text-lake-700 hover:text-lake-600">
            Visos varžybos →
          </Link>
        </div>
      </section>
    </>
  );
}
