import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import type { Competition } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney, todayLt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Varžybos",
  description: "Karpių žvejybos varžybos Šilų (Bridų) tvenkinyje – kalendorius ir rezultatai.",
};

export default async function CompetitionsPage() {
  await connection();
  const today = todayLt();
  const all = await prisma.competition.findMany({ where: { published: true }, orderBy: { date: "asc" } });
  const upcoming = all.filter((c) => (c.endDate ?? c.date) >= today);
  const past = all.filter((c) => (c.endDate ?? c.date) < today).reverse();

  return (
    <>
      <PageHeader
        eyebrow="Varžybos"
        title="Žvejybos varžybos"
        intro="Karpių žvejybos varžybos komandoms ir individualiems žvejams. Registracija – telefonu arba el. paštu."
        image="/images/sektorius-10.jpg"
      />
      <div className="container-page py-12">
        <h2 className="font-display text-3xl font-semibold text-pine-900">Artėjančios</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-pine-800">Šiuo metu suplanuotų varžybų nėra.</p>
        ) : (
          <div className="mt-6 space-y-6">
            {upcoming.map((c) => (
              <CompetitionCard key={c.id} c={c} upcoming />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mt-16 font-display text-3xl font-semibold text-pine-900">Įvykusios</h2>
            <div className="mt-6 space-y-6">
              {past.map((c) => (
                <CompetitionCard key={c.id} c={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CompetitionCard({ c, upcoming = false }: { c: Competition; upcoming?: boolean }) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-pine-900/10 bg-white md:grid-cols-[280px_1fr]">
      <div className="relative min-h-48 bg-pine-100">
        {c.image ? (
          <Image src={c.image} alt="" fill sizes="(min-width: 768px) 280px, 100vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center font-display text-3xl font-semibold text-pine-800">
            {formatDate(c.date, { month: "short", day: "numeric" })}
          </div>
        )}
      </div>
      <div className="p-6 sm:p-8">
        <p className="text-sm font-semibold text-lake-700">
          {formatDate(c.date)}
          {c.endDate && c.endDate !== c.date ? ` – ${formatDate(c.endDate)}` : ""}
        </p>
        <h3 className="mt-1 font-display text-2xl font-semibold text-pine-900">{c.title}</h3>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-pine-800">{c.description}</p>
        {(c.entryFee != null || c.maxTeams != null) && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {c.entryFee != null && (
              <div>
                <dt className="inline text-pine-700">Starto mokestis: </dt>
                <dd className="inline font-semibold text-pine-900">{formatMoney(c.entryFee)}</dd>
              </div>
            )}
            {c.maxTeams != null && (
              <div>
                <dt className="inline text-pine-700">Vietų: </dt>
                <dd className="inline font-semibold text-pine-900">{c.maxTeams}</dd>
              </div>
            )}
          </dl>
        )}
        {c.results && (
          <div className="mt-5 rounded-xl bg-sand-100 p-4">
            <p className="text-sm font-semibold text-pine-900">Rezultatai</p>
            <p className="mt-1 whitespace-pre-line text-sm text-pine-800">{c.results}</p>
          </div>
        )}
        {upcoming && (
          <a
            href={site.phoneHref}
            className="mt-6 inline-block rounded-full bg-lake-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lake-700"
          >
            Registruotis: {site.phone}
          </a>
        )}
      </div>
    </article>
  );
}
