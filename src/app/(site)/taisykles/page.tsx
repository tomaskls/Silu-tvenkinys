import type { Metadata } from "next";
import { rules, site } from "@/content/site";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Žvejybos taisyklės",
  description: "Šilų (Bridų) tvenkinio žvejybos taisyklės.",
};

export default function RulesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Taisyklės"
        title="Žvejybos taisyklės"
        intro="Rūpinamės žuvimi ir vieni kitais. Prašome susipažinti su taisyklėmis prieš atvykstant – rezervuodami sektorių su jomis sutinkate."
        image="/images/sektorius-3.jpg"
      />
      <div className="container-page grid gap-6 py-16 md:grid-cols-2">
        {rules.map((section, i) => (
          <section key={section.title} className="rounded-2xl border border-pine-900/10 bg-white p-6 sm:p-8">
            <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-pine-900">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-wood-100 text-base text-wood-600">
                {i + 1}
              </span>
              {section.title}
            </h2>
            <ul className="mt-5 space-y-3 text-pine-800">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-lake-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="container-page">
        <p className="rounded-2xl bg-lake-100 p-6 text-pine-900">
          Kilus klausimams skambinkite <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>.
        </p>
      </div>
    </>
  );
}
