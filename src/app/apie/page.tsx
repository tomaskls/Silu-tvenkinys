import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { pondAbout, site } from "@/content/site";
import { PageHeader } from "@/components/page-header";
import { SectorMap } from "@/components/sector-map";

export const metadata: Metadata = {
  title: "Apie tvenkinį",
  description: "Šilų (Bridų) tvenkinys: sektoriai, žuvys, patogumai ir kaip atvykti.",
};

const photos = [
  { src: "/images/sektorius-2.jpg", alt: "Sektorius Nr. 2 su nauju lieptu" },
  { src: "/images/sektorius-3.jpg", alt: "Sektorius Nr. 3 rudenį" },
  { src: "/images/sektorius-palapine.jpg", alt: "Palapinė prie sektoriaus" },
  { src: "/images/sektorius-9.jpg", alt: "Sektorius Nr. 9" },
];

export default async function AboutPage() {
  await connection();
  const sectors = await prisma.sector.findMany({ where: { active: true }, orderBy: { number: "asc" } });

  return (
    <>
      <PageHeader eyebrow="Apie tvenkinį" title={site.name} intro={pondAbout.intro} image="/images/tvenkinys-is-virsaus.jpg" />

      <section className="container-page grid gap-12 py-16 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-5 text-lg leading-relaxed text-pine-800">
          {pondAbout.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-pine-900/10 bg-white p-6">
            <h2 className="font-semibold text-pine-900">Žuvys</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pondAbout.species.map((s) => (
                <li key={s} className="rounded-full bg-lake-100 px-3 py-1 text-sm font-medium text-lake-700">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-pine-900/10 bg-white p-6">
            <h2 className="font-semibold text-pine-900">Patogumai</h2>
            <ul className="mt-3 space-y-2 text-pine-800">
              {pondAbout.amenities.map((a) => (
                <li key={a} className="flex gap-2">
                  <span aria-hidden className="text-emerald-600">✓</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="container-page">
        <h2 className="font-display text-3xl font-semibold text-pine-900">Sektorių žemėlapis</h2>
        <p className="mt-2 text-pine-800">
          Para: nuo {site.booking.checkInTime} atvykimo dieną iki {site.booking.checkOutTime} išvykimo dieną.
        </p>
        <div className="mt-6">
          <SectorMap sectors={sectors.map((s) => ({ id: s.id, number: s.number, state: "neutral" }))} />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {sectors.map((s) => (
            <div key={s.id} className="rounded-xl border border-pine-900/10 bg-white p-4">
              <p className="font-display text-xl font-semibold text-pine-900">Nr. {s.number}</p>
              <p className="text-sm text-pine-700">{s.description || s.name}</p>
              <p className="mt-2 text-sm font-semibold text-wood-600">{formatMoney(s.pricePerDay)} / para</p>
            </div>
          ))}
        </div>
        <Link
          href="/rezervacija"
          className="mt-8 inline-block rounded-full bg-wood-500 px-6 py-3 font-semibold text-white hover:bg-wood-600"
        >
          Rezervuoti sektorių
        </Link>
      </section>

      <section className="container-page mt-16 grid gap-4 sm:grid-cols-2">
        {photos.map((p) => (
          <div key={p.src} className="relative aspect-4/3 overflow-hidden rounded-2xl">
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
          </div>
        ))}
      </section>

      <section className="container-page mt-16">
        <h2 className="font-display text-3xl font-semibold text-pine-900">Kaip atvykti</h2>
        <p className="mt-2 text-pine-800">{site.address}</p>
        {site.mapEmbedUrl ? (
          <iframe
            src={site.mapEmbedUrl}
            className="mt-6 h-96 w-full rounded-2xl border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Tvenkinio vieta žemėlapyje"
          />
        ) : (
          <p className="mt-4 rounded-xl bg-sand-100 p-4 text-sm text-pine-700">
            Tikslią vietą ir atvykimo instrukcijas suteiksime paskambinus: <a className="font-semibold underline" href={site.phoneHref}>{site.phone}</a>
          </p>
        )}
      </section>
    </>
  );
}
