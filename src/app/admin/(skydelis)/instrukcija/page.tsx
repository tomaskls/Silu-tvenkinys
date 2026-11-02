import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { SESSION_MAX_AGE } from "@/lib/admin-session";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Instrukcija", robots: { index: false } };

const { checkInTime, checkOutTime } = site.booking;

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-pine-900/10 bg-white p-5 sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-pine-900 sm:text-2xl">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-wood-100 text-base text-wood-600">{n}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 leading-relaxed text-pine-800">{children}</div>
    </section>
  );
}

/** Lentelės ženklas ir jo paaiškinimas */
function Legend({ sample, children }: { sample: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex w-20 shrink-0 justify-center">{sample}</span>
      <span>{children}</span>
    </li>
  );
}

export default async function InstructionsPage() {
  await requireAdminPage();

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href="/admin" className="text-sm font-semibold text-lake-700 underline">
        ‹ Atgal į lentelę
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-pine-900">Kaip naudotis</h1>
      <p className="mt-2 text-lg leading-relaxed text-pine-800">
        Lentelėje žymite, kurie sektoriai užimti. Klientas paskambina – jūs pažymite sektorių, ir svetainėje jis iškart
        rodomas kaip užimtas.
      </p>

      <div className="mt-8 space-y-5">
        <Section n={1} title="Kaip skaityti lentelę">
          <p>Eilutės – sektoriai, stulpeliai – dienos.</p>
          <ul className="space-y-3">
            <Legend sample={<span className="h-8 w-14 rounded border border-pine-900/15 bg-emerald-50/60" />}>
              Šviesus langelis – sektorius <strong>laisvas</strong>.
            </Legend>
            <Legend
              sample={
                <span className="flex h-7 w-16 items-center rounded-md bg-red-600 px-2 text-xs font-semibold text-white">Jonas</span>
              }
            >
              Raudona juosta – sektorius <strong>užimtas</strong>. Ant jos – kliento vardas.
            </Legend>
            <Legend
              sample={
                <span className="grid h-5 min-w-6 place-items-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                  8
                </span>
              }
            >
              Skaičius po data – kiek sektorių tą dieną laisva. Raudonas <strong>0</strong> – viskas užimta.
            </Legend>
            <Legend
              sample={
                <span className="flex flex-col gap-0.5 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    laisvas
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <span className="size-2 rounded-full bg-red-600" />
                    iki 5 d.
                  </span>
                </span>
              }
            >
              Prie sektoriaus numerio – ar jis laisvas šiandien, o jei užimtas – iki kurios dienos.
            </Legend>
            <Legend
              sample={<span className="h-8 w-14 rounded border-x-2 border-lake-500 bg-emerald-50/60 ring-1 ring-pine-900/10" />}
            >
              Mėlynai apvesta – šiandiena. Pilkos dienos – jau praėjusios.
            </Legend>
          </ul>

          <figure className="rounded-xl bg-sand-50 p-4">
            <div className="max-w-sm">
              <div className="grid grid-cols-3 text-center text-xs font-semibold text-pine-700">
                <span>3 d.</span>
                <span>4 d.</span>
                <span>5 d.</span>
              </div>
              <div className="relative mt-1 grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-pine-900/10 bg-white">
                <span className="bg-emerald-50/60" />
                <span className="border-x border-pine-900/10 bg-emerald-50/60" />
                <span className="bg-emerald-50/60" />
                <span className="absolute inset-y-1.5 left-[calc(100%/6)] right-[calc(100%/6)] flex items-center rounded-md bg-red-600 px-2 text-xs font-semibold text-white">
                  Jonas
                </span>
              </div>
              <div className="relative mt-1 h-4 text-xs font-semibold text-pine-700">
                <span className="absolute left-[calc(100%/6)] -translate-x-1/2">{checkInTime}</span>
                <span className="absolute right-[calc(100%/6)] translate-x-1/2">{checkOutTime}</span>
              </div>
            </div>
            <figcaption className="mt-3 text-sm leading-relaxed text-pine-800">
              Juosta prasideda ir baigiasi dienos viduryje: Jonas atvyksta 3 d. {checkInTime}, išvyksta 5 d. {checkOutTime} – tai
              2 paros. Todėl tą pačią dieną vienas klientas gali išvykti, o kitas atvykti.
            </figcaption>
          </figure>

          <p className="text-sm text-pine-700">Telefone lentelę pastumkite pirštu į šoną – pamatysite kitas dienas.</p>
        </Section>

        <Section n={2} title="Kai skambina klientas">
          <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-wood-600">
            <li>Raskite dieną, kada klientas nori atvykti, ir laisvą sektorių.</li>
            <li>Paspauskite tą šviesų langelį – atsidarys langas.</li>
            <li>
              Nurodykite, kiek <strong>parų</strong> klientas bus. 1 para – nuo {checkInTime} iki kitos dienos {checkOutTime}.
              Žemiau matysite, kada išvykimas.
            </li>
            <li>
              Įrašykite vardą ir telefoną (nebūtina, bet patogu). Jei klientas jau buvo, pradėkite rašyti vardą ir pasirinkite jį iš
              sąrašo – telefonas įsirašys pats.
            </li>
            <li>
              Spauskite <strong>„Pažymėti užimtą“</strong>. Apačioje pasirodys pranešimas su ✓ – viskas išsaugota.
            </li>
          </ol>
          <ul className="space-y-1.5 rounded-xl bg-sand-50 p-4 text-sm">
            <li>Kompanijai galima pažymėti kelis sektorius iš karto – lange paspauskite kelis numerius.</li>
            <li>Perbrauktas numeris reiškia, kad tas sektorius tomis dienomis jau užimtas.</li>
            <li>Tą patį galima padaryti ir mygtuku „+ Nauja rezervacija“ viršuje.</li>
          </ul>
        </Section>

        <Section n={3} title="Kaip pakeisti ar ištrinti">
          <p>
            Paspauskite raudoną juostą (arba „Keisti“ sąraše po lentele). Pakeiskite, ką reikia – datą, paras, sektorių ar vardą
            – ir spauskite <strong>„Išsaugoti“</strong>.
          </p>
          <p>
            Jei klientas atšaukė: spauskite <strong>„Ištrinti“</strong>, tada <strong>„Taip, ištrinti“</strong>. Sektorius vėl
            taps laisvas. Persigalvojus – „Ne, palikti“.
          </p>
          <p>Mygtukas „Uždaryti“ tik uždaro langą – nieko nepakeičia.</p>
        </Section>

        <Section n={4} title="Kitos dienos ir sąrašas">
          <p>
            „7 d. ›“ – savaitė į priekį, „‹ 7 d.“ – savaitė atgal, „Šiandien“ – grįžti į šiandieną. Galite ir pasirinkti datą
            kalendoriuje.
          </p>
          <p>Po lentele – visų būsimų rezervacijų sąrašas. Paspaudę telefono numerį, iškart paskambinsite klientui.</p>
        </Section>

        <Section n={5} title="Naudinga žinoti">
          <ul className="list-disc space-y-2 pl-5 marker:text-lake-500">
            <li>Svetainėje klientai mato tik, ar sektorius laisvas. Vardų, telefonų ir pastabų jie nemato.</li>
            <li>Pakeitimai svetainėje matomi iš karto.</li>
            <li>
              Prisijungimas galioja {SESSION_MAX_AGE / 86_400} dienų. Jei pasirodo „Sesija baigėsi“ – perkraukite puslapį ir
              prisijunkite iš naujo.
            </li>
            <li>
              Patogu telefone: naršyklės meniu pasirinkite „Pridėti prie pradžios ekrano“ – lentelė atsidarys vienu paspaudimu.
            </li>
          </ul>
        </Section>
      </div>

      <Link
        href="/admin"
        className="mt-8 inline-block rounded-full bg-wood-500 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600"
      >
        Į užimtumo lentelę
      </Link>
    </div>
  );
}
