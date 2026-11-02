import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CatchCard } from "@/components/catch-card";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Laimikių galerija",
  description: "Šilų (Bridų) tvenkinyje sugauti karpiai ir kiti laimikiai.",
};

export default async function GalleryPage(props: PageProps<"/galerija">) {
  await connection();
  const { rikiuoti } = await props.searchParams;
  const byWeight = rikiuoti === "svoris";

  const photos = await prisma.catchPhoto.findMany({
    where: { published: true },
    orderBy: byWeight ? [{ weightKg: { sort: "desc", nulls: "last" } }] : [{ date: "desc" }, { id: "desc" }],
  });

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-pine-900 text-white" : "bg-white text-pine-800 hover:bg-pine-50 border border-pine-900/10"
    }`;

  return (
    <>
      <PageHeader
        eyebrow="Galerija"
        title="Laimikiai"
        intro="Žvejų pasididžiavimas – karpiai ir kiti trofėjai, sugauti mūsų tvenkinyje."
        image="/images/laimikis-karpis-15-5kg.jpg"
      />
      <div className="container-page py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Link href="/galerija" className={tabClass(!byWeight)} scroll={false}>
              Naujausi
            </Link>
            <Link href="/galerija?rikiuoti=svoris" className={tabClass(byWeight)} scroll={false}>
              Didžiausi
            </Link>
          </div>
          <p className="text-sm text-pine-700">
            Pagavote trofėjų? Atsiųskite nuotrauką{" "}
            <a href={`mailto:${site.email}`} className="font-semibold underline">
              el. paštu
            </a>
            .
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="mt-12 text-center text-pine-700">Nuotraukų dar nėra.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <CatchCard key={p.id} photo={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
