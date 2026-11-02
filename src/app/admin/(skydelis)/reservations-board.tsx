"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import type { AdminReservation, KnownCustomer } from "@/lib/reservations";
import { addDays, diffDays, formatDate, formatDateRange, isIsoDate, pluralParos, todayLt } from "@/lib/format";
import { site } from "@/content/site";
import { deleteReservationAction, saveReservationAction } from "../actions";

type Sector = { id: number; number: number };

type Props = {
  today: string;
  start: string;
  days: number;
  sectors: Sector[];
  /** Rezervacijos, patenkančios į rodomą lentelės laikotarpį */
  reservations: AdminReservation[];
  /** Visos dabartinės ir būsimos rezervacijos */
  upcoming: AdminReservation[];
  /** Anksčiau įvesti klientai – vardui pasirinkti iš sąrašo */
  customers: KnownCustomer[];
  maxDays: number;
};

/** Pranešimas po išsaugojimo ar ištrynimo */
type Notice = { title: string; detail: string };

type Draft = {
  id?: string;
  sectorIds: number[];
  dateFrom: string;
  days: number;
  customerName: string;
  customerPhone: string;
  notes: string;
};

const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
const MONTHS_SHORT = ["saus.", "vas.", "kov.", "bal.", "geg.", "birž.", "liep.", "rugp.", "rugs.", "spal.", "lapkr.", "gruod."];

const weekdayIndex = (d: string) => (new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7;
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

function describe(r: AdminReservation): string {
  return [`Nr. ${r.sectorNumber}`, formatDateRange(r.dateFrom, r.dateTo), r.customerName, r.customerPhone, r.notes]
    .filter(Boolean)
    .join(" · ");
}

export function ReservationsBoard({ today, start, days, sectors, reservations, upcoming, customers, maxDays }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  // Kiekvienas atidarymas – nauja formos būsena
  const [dialogKey, setDialogKey] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Pranešimas po kelių sekundžių pasislepia pats
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const known = useMemo(() => {
    const byId = new Map<string, AdminReservation>();
    for (const r of [...reservations, ...upcoming]) byId.set(r.id, r);
    return [...byId.values()];
  }, [reservations, upcoming]);

  const busyToday = new Set(known.filter((r) => r.dateFrom <= today && r.dateTo > today).map((r) => r.sectorId)).size;
  const arrivingToday = known.filter((r) => r.dateFrom === today).length;

  function open(next: Draft) {
    setDraft(next);
    setDialogKey((k) => k + 1);
  }

  function openNew(sectorIds: number[], dateFrom: string) {
    open({ sectorIds, dateFrom, days: 1, customerName: "", customerPhone: "", notes: "" });
  }

  function openEdit(r: AdminReservation) {
    open({
      id: r.id,
      sectorIds: [r.sectorId],
      dateFrom: r.dateFrom,
      days: diffDays(r.dateFrom, r.dateTo),
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      notes: r.notes,
    });
  }

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pine-900">Sektorių užimtumas</h1>
          <p className="mt-1 text-sm text-pine-700">
            Šiandien užimta {busyToday} iš {sectors.length} · atvyksta {arrivingToday}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNew([], today >= start ? today : start)}
          className="rounded-full bg-wood-500 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600"
        >
          + Nauja rezervacija
        </button>
      </div>

      <BoardNav start={start} today={today} days={days} />
      <OccupancyGrid
        start={start}
        days={days}
        today={today}
        sectors={sectors}
        reservations={reservations}
        known={known}
        onCreate={(sectorId, date) => openNew([sectorId], date)}
        onEdit={openEdit}
      />
      <p className="mt-2 text-xs leading-relaxed text-pine-700">
        Šviesus langelis – sektorius laisvas: paspaudę pažymėsite jį užimtu. Paspauskite rezervaciją – galėsite ją pakeisti arba
        ištrinti. Juosta prasideda atvykimo dieną {site.booking.checkInTime} ir baigiasi išvykimo dieną{" "}
        {site.booking.checkOutTime} – po to sektorius jau laisvas. Skaičius po data – kiek sektorių tą dieną laisva atvykti, prie
        sektoriaus numerio – ar jis laisvas {start === today ? "šiandien" : formatDate(start, { year: undefined })}.{" "}
        <Link href="/admin/instrukcija" className="font-semibold text-lake-700 underline">
          Instrukcija
        </Link>
      </p>

      <UpcomingList upcoming={upcoming} today={today} onEdit={openEdit} />

      {draft && (
        <ReservationDialog
          key={dialogKey}
          draft={draft}
          sectors={sectors}
          known={known}
          customers={customers}
          maxDays={maxDays}
          onDone={setNotice}
          onClose={() => setDraft(null)}
        />
      )}

      {/* Visada įdėtas, kad ekrano skaitytuvai praneštų apie naują pranešimą */}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center"
      >
        {notice && (
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-pine-900 p-4 text-white shadow-2xl">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-lg font-bold">✓</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice.title}</p>
              <p className="mt-0.5 text-sm text-white/80">{notice.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Uždaryti pranešimą"
              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-xl leading-none text-white/70 hover:bg-white/10"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardNav({ start, today, days }: { start: string; today: string; days: number }) {
  const router = useRouter();
  const linkClass = "rounded-full border border-pine-900/15 bg-white px-3.5 py-1.5 text-sm font-semibold text-pine-900 hover:bg-pine-50";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Link href={`/admin?nuo=${addDays(start, -7)}`} className={linkClass}>
        ‹ 7 d.
      </Link>
      <Link href="/admin" className={start === today ? `${linkClass} border-pine-900 bg-pine-100` : linkClass}>
        Šiandien
      </Link>
      <Link href={`/admin?nuo=${addDays(start, 7)}`} className={linkClass}>
        7 d. ›
      </Link>
      <input
        type="date"
        value={start}
        onChange={(e) => e.target.value && router.push(`/admin?nuo=${e.target.value}`)}
        aria-label="Rodyti nuo datos"
        className="rounded-full border border-pine-900/15 bg-white px-3 py-1.5 text-sm"
      />
      <span className="ml-auto text-sm font-semibold text-pine-800">{formatDateRange(start, addDays(start, days - 1))}</span>
    </div>
  );
}

type GridProps = {
  start: string;
  days: number;
  today: string;
  sectors: Sector[];
  reservations: AdminReservation[];
  /** Ir už rodomo laikotarpio – sektoriaus būsenai („užimtas iki“) */
  known: AdminReservation[];
  onCreate: (sectorId: number, date: string) => void;
  onEdit: (r: AdminReservation) => void;
};

function OccupancyGrid({ start, days, today, sectors, reservations, known, onCreate, onEdit }: GridProps) {
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);
  const end = addDays(start, days);
  // Kiekviena diena – du pusės dienos stulpeliai, kad juosta prasidėtų ir baigtųsi dienos viduryje.
  // Stulpelių linijos: dienos i pradžia – 2i + 2, vidurys – 2i + 3.
  const columns = { gridTemplateColumns: `5rem repeat(${days * 2}, minmax(1.625rem, 1fr))` };

  // Kiek sektorių laisva kiekvieną dieną (išvykimo dieną sektorius laisvas – tą dieną galima atvykti)
  const freeCounts = useMemo(
    () =>
      dates.map(
        (d) => sectors.filter((s) => !reservations.some((r) => r.sectorId === s.id && r.dateFrom <= d && r.dateTo > d)).length,
      ),
    [dates, sectors, reservations],
  );

  // Kiekvieno sektoriaus būsena pirmą rodomą dieną
  const busyUntil = useMemo(() => new Map(sectors.map((s) => [s.id, occupiedUntil(known, s.id, start)])), [sectors, known, start]);
  // „5 d.“, kito mėnesio diena – „12-05“
  const untilLabel = (d: string) => (d.slice(0, 7) === start.slice(0, 7) ? `${Number(d.slice(8))} d.` : d.slice(5));

  // Laisvi langeliai beveik balti su švelniu žaliu atspalviu (savaitgaliai – kiek ryškesni), kad raudonos juostos išsiskirtų;
  // praėjusios dienos pilkos, šiandiena – mėlynais kraštais
  const cellStyle = (d: string) => {
    if (d < today) return "bg-stone-100 hover:bg-stone-200";
    const free = weekdayIndex(d) >= 5 ? "bg-emerald-100/60 hover:bg-emerald-200/70" : "bg-emerald-50/60 hover:bg-emerald-100";
    return d === today ? `${free} shadow-[inset_2px_0_0_var(--color-lake-500),inset_-2px_0_0_var(--color-lake-500)]` : free;
  };

  const countStyle = (d: string, free: number) =>
    d < today ? "bg-stone-200 text-stone-500" : free === 0 ? "bg-red-600 text-white" : "bg-emerald-600 text-white";

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-pine-900/10 bg-white">
      <div style={{ minWidth: `calc(5rem + ${days} * 3.25rem)` }}>
        {/* Datų antraštė su laisvų sektorių skaičiumi */}
        <div className="grid border-b border-pine-900/10 bg-sand-100 text-center" style={columns}>
          <div className="sticky left-0 z-20 flex flex-col justify-end bg-sand-100 px-2 pb-1.5 text-left text-[11px] font-semibold leading-5 text-pine-700">
            Laisva
          </div>
          {dates.map((d, i) => {
            const wd = weekdayIndex(d);
            return (
              <div
                key={d}
                style={{ gridColumn: "span 2" }}
                className={`border-l border-pine-900/10 px-1 py-1.5 ${
                  d === today ? "bg-lake-100 text-lake-700" : wd >= 5 ? "text-wood-600" : "text-pine-800"
                }`}
              >
                <div className="text-[11px] font-semibold">{WEEKDAYS[wd]}</div>
                <div className="font-display text-lg font-semibold leading-tight">{Number(d.slice(8))}</div>
                <div className="h-3 text-[10px] leading-none opacity-80">
                  {i === 0 || d.endsWith("-01") ? MONTHS_SHORT[Number(d.slice(5, 7)) - 1] : ""}
                </div>
                <div
                  title={`Laisvų sektorių: ${freeCounts[i]} iš ${sectors.length}`}
                  className={`mx-auto mt-1 w-fit min-w-6 rounded-full px-1.5 text-xs font-bold leading-5 ${countStyle(d, freeCounts[i])}`}
                >
                  {freeCounts[i]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sektoriai */}
        {sectors.map((s) => {
          const until = busyUntil.get(s.id);
          return (
            <div key={s.id} className="grid border-b border-pine-900/10 last:border-b-0" style={columns}>
              <div
                style={{ gridColumn: 1, gridRow: 1 }}
                title={until ? `Užimtas iki ${formatDate(until)} ${site.booking.checkOutTime}` : `Laisvas ${formatDate(start)}`}
                className="sticky left-0 z-20 flex flex-col justify-center border-r border-pine-900/10 bg-white px-2"
              >
                <span className="text-sm font-semibold text-pine-900">Nr. {s.number}</span>
                <span
                  className={`flex items-center gap-1 text-[11px] font-semibold leading-tight ${until ? "text-red-700" : "text-emerald-700"}`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${until ? "bg-red-600" : "bg-emerald-600"}`} />
                  {until ? `iki ${untilLabel(until)}` : "laisvas"}
                </span>
              </div>
              {dates.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  style={{ gridColumn: `${2 * i + 2} / span 2`, gridRow: 1 }}
                  onClick={() => onCreate(s.id, d)}
                  aria-label={`Sektorius ${s.number}, ${formatDate(d)}: pažymėti užimtu`}
                  className={`h-12 border-l border-pine-900/10 transition-colors first-of-type:border-l-0 ${cellStyle(d)}`}
                />
              ))}
              {reservations
                .filter((r) => r.sectorId === s.id)
                .map((r) => {
                  // Nuo atvykimo dienos vidurio iki išvykimo dienos vidurio; už lentelės ribų – nukerpama
                  const from = r.dateFrom < start ? 2 : 2 * diffDays(start, r.dateFrom) + 3;
                  const to = r.dateTo < end ? 2 * diffDays(start, r.dateTo) + 3 : 2 * days + 2;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onEdit(r)}
                      title={describe(r)}
                      style={{ gridColumn: `${from} / ${to}`, gridRow: 1 }}
                      className={`z-10 my-1.5 flex min-w-0 items-center bg-red-600 px-2 text-left text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 ${
                        r.dateFrom < start ? "" : "ml-1 rounded-l-lg"
                      } ${r.dateTo < end ? "mr-1 rounded-r-lg" : ""} ${r.dateTo <= today ? "opacity-50" : ""}`}
                    >
                      <span className="truncate">{r.customerName || "Užimta"}</span>
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Iki kurios dienos sektorius užimtas nuo `day` (gretimos rezervacijos sujungiamos); null – tą dieną galima atvykti. */
function occupiedUntil(list: AdminReservation[], sectorId: number, day: string): string | null {
  let until: string | null = null;
  const own = list.filter((r) => r.sectorId === sectorId).sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  for (const r of own) {
    const at = until ?? day;
    if (r.dateFrom <= at && r.dateTo > at) until = r.dateTo;
  }
  return until;
}

function UpcomingList({ upcoming, today, onEdit }: { upcoming: AdminReservation[]; today: string; onEdit: (r: AdminReservation) => void }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold text-pine-900">Artimiausios rezervacijos</h2>
      {upcoming.length === 0 ? (
        <p className="mt-3 text-pine-700">Būsimų rezervacijų nėra.</p>
      ) : (
        <ul className="mt-4 divide-y divide-pine-900/10 overflow-hidden rounded-2xl border border-pine-900/10 bg-white">
          {upcoming.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="font-semibold text-pine-900 sm:w-44">
                {formatDateRange(r.dateFrom, r.dateTo)}
                {r.dateFrom <= today && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">dabar</span>
                )}
              </span>
              <span className="font-semibold text-wood-600 sm:w-14">Nr. {r.sectorNumber}</span>
              {/* Telefone: datos, sektorius ir mygtukas – vienoje eilutėje, klientas – po jais */}
              <span className="order-4 w-full min-w-0 sm:order-0 sm:w-auto sm:flex-1">
                <span className="font-semibold">{r.customerName || "—"}</span>
                {r.customerPhone && (
                  <>
                    {" · "}
                    <a href={telHref(r.customerPhone)} className="text-lake-700 underline">
                      {r.customerPhone}
                    </a>
                  </>
                )}
                {r.notes && <span className="block text-pine-700 italic">„{r.notes}“</span>}
              </span>
              <button
                type="button"
                onClick={() => onEdit(r)}
                className="order-3 ml-auto rounded-full border border-pine-900/15 px-3 py-1 text-xs font-semibold text-pine-900 hover:bg-pine-50 sm:order-last"
              >
                Keisti
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type DialogProps = {
  draft: Draft;
  sectors: Sector[];
  known: AdminReservation[];
  customers: KnownCustomer[];
  maxDays: number;
  /** Iškviečiama sėkmingai išsaugojus ar ištrynus */
  onDone: (notice: Notice) => void;
  onClose: () => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-pine-900/20 bg-white px-3 py-2.5 outline-none focus:border-lake-600 focus:ring-2 focus:ring-lake-100";

function ReservationDialog({ draft, sectors, known, customers, maxDays, onDone, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const nameId = useId();
  const [form, setForm] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(draft.id);

  // „Nr. 1, 3 · lapkričio 3–5 d. · Vardenis“
  const summary = (d: Draft) =>
    [
      `Nr. ${sectors
        .filter((s) => d.sectorIds.includes(s.id))
        .map((s) => s.number)
        .join(", ")}`,
      formatDateRange(d.dateFrom, addDays(d.dateFrom, d.days)),
      d.customerName.trim(),
    ]
      .filter(Boolean)
      .join(" · ");

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  const daysValid = Number.isInteger(form.days) && form.days >= 1 && form.days <= maxDays;
  const dateTo = isIsoDate(form.dateFrom) && daysValid ? addDays(form.dateFrom, form.days) : null;

  // Kitos rezervacijos, kurios persidengia su pasirinktomis dienomis (galutinai tikrina serveris)
  const overlapping = dateTo
    ? known.filter((r) => r.id !== draft.id && r.dateFrom < dateTo && r.dateTo > form.dateFrom)
    : [];
  const busySectors = new Set(overlapping.map((r) => r.sectorId));
  const conflicts = overlapping.filter((r) => form.sectorIds.includes(r.sectorId));
  const canSave = form.sectorIds.length > 0 && dateTo !== null && conflicts.length === 0;

  const update = (patch: Partial<Draft>) => setForm((f) => ({ ...f, ...patch }));
  const close = () => ref.current?.close();

  function toggleSector(id: number) {
    setForm((f) =>
      isEdit
        ? { ...f, sectorIds: [id] }
        : { ...f, sectorIds: f.sectorIds.includes(id) ? f.sectorIds.filter((x) => x !== id) : [...f.sectorIds, id] },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveReservationAction(form);
      if (result.error) return setError(result.error);
      onDone({
        title: isEdit
          ? "Rezervacija išsaugota"
          : form.sectorIds.length > 1
            ? "Sektoriai pažymėti užimtais"
            : "Sektorius pažymėtas užimtu",
        detail: summary(form),
      });
      close();
    });
  }

  function remove() {
    if (!draft.id) return;
    const id = draft.id;
    setError(null);
    startTransition(async () => {
      const result = await deleteReservationAction(id);
      if (result.error) return setError(result.error);
      onDone({ title: "Rezervacija ištrinta", detail: `${summary(draft)}. Sektorius vėl laisvas.` });
      close();
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white shadow-2xl backdrop:bg-pine-950/60"
    >
      <form onSubmit={submit} className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-pine-900">
            {isEdit ? "Rezervacija" : "Nauja rezervacija"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Uždaryti"
            className="-mr-2 -mt-1 grid size-9 place-items-center rounded-full text-2xl leading-none text-pine-700 hover:bg-pine-50"
          >
            ×
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-pine-900">{isEdit ? "Sektorius" : "Sektoriai"}</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {sectors.map((s) => {
              const selected = form.sectorIds.includes(s.id);
              const busy = busySectors.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSector(s.id)}
                  disabled={busy && !selected}
                  aria-pressed={selected}
                  title={busy ? "Užimta pasirinktomis dienomis" : undefined}
                  className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? busy
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-wood-500 bg-wood-500 text-white"
                      : busy
                        ? "cursor-not-allowed border-transparent bg-stone-100 text-stone-400 line-through"
                        : "border-pine-900/15 bg-white text-pine-900 hover:border-pine-700"
                  }`}
                >
                  {s.number}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-pine-700">
            {isEdit
              ? "Perbraukti – tomis dienomis užimti."
              : "Galite pažymėti kelis sektorius – kiekvienam bus sukurta atskira rezervacija. Perbraukti – užimti."}
          </p>
        </fieldset>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-semibold text-pine-900">Atvykimas</span>
            <input
              type="date"
              required
              value={form.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className={inputClass}
            />
          </label>
          <div>
            <label htmlFor="reservation-days" className="block text-sm font-semibold text-pine-900">
              Parų skaičius
            </label>
            <div className="mt-1.5 flex">
              <button
                type="button"
                onClick={() => update({ days: Math.max(1, (form.days || 1) - 1) })}
                aria-label="Viena para mažiau"
                className="rounded-l-xl border border-r-0 border-pine-900/20 px-3 text-lg hover:bg-pine-50"
              >
                −
              </button>
              <input
                id="reservation-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={maxDays}
                required
                value={Number.isFinite(form.days) ? form.days : ""}
                onChange={(e) => update({ days: e.target.valueAsNumber })}
                className="w-full min-w-0 border border-pine-900/20 px-2 py-2.5 text-center outline-none focus:border-lake-600"
              />
              <button
                type="button"
                onClick={() => update({ days: Math.min(maxDays, (form.days || 0) + 1) })}
                aria-label="Viena para daugiau"
                className="rounded-r-xl border border-l-0 border-pine-900/20 px-3 text-lg hover:bg-pine-50"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-pine-700">
          Išvykimas:{" "}
          <strong className="text-pine-900">
            {dateTo
              ? `${formatDate(dateTo, { year: undefined, weekday: "long" })}, ${site.booking.checkOutTime} (${pluralParos(form.days)})`
              : "—"}
          </strong>
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={nameId} className="block text-sm font-semibold text-pine-900">
              Vardas, pavardė
            </label>
            <CustomerNameField
              id={nameId}
              value={form.customerName}
              customers={customers}
              onChange={(customerName) => update({ customerName })}
              onPick={(c) => update({ customerName: c.name, customerPhone: c.phone })}
            />
          </div>
          <label className="block">
            <span className="flex items-baseline justify-between text-sm font-semibold text-pine-900">
              Telefonas
              {isEdit && draft.customerPhone && (
                <a href={telHref(draft.customerPhone)} className="text-xs font-semibold text-lake-700 underline">
                  Skambinti
                </a>
              )}
            </span>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => update({ customerPhone: e.target.value })}
              maxLength={30}
              autoComplete="off"
              placeholder="Neprivaloma"
              className={inputClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-sm font-semibold text-pine-900">Pastabos</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              maxLength={1000}
              placeholder="Pvz. 2 žvejai, atvyks vakare"
              className={inputClass}
            />
          </label>
        </div>

        {conflicts.length > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {conflicts
              .map((c) => `Nr. ${c.sectorNumber} jau užimtas ${formatDateRange(c.dateFrom, c.dateTo)}${c.customerName ? ` (${c.customerName})` : ""}.`)
              .join(" ")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {confirmingDelete ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-900">Ar tikrai ištrinti šią rezervaciją?</p>
            <p className="mt-1 text-sm text-red-800">{summary(draft)}. Sektorius taps laisvas.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Trinama…" : "Taip, ištrinti"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmingDelete(false)}
                disabled={pending}
                className="rounded-full border border-pine-900/20 bg-white px-5 py-2.5 font-semibold text-pine-900 hover:bg-pine-50"
              >
                Ne, palikti
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending || !canSave}
              className="rounded-full bg-wood-500 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {pending ? "Saugoma…" : isEdit ? "Išsaugoti" : "Pažymėti užimtą"}
            </button>
            {/* Redaguojant ne „Atšaukti“ – kad nebūtų painiojama su rezervacijos atšaukimu */}
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-pine-900/20 px-5 py-3 font-semibold text-pine-900 hover:bg-pine-50"
            >
              {isEdit ? "Uždaryti" : "Atšaukti"}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setConfirmingDelete(true);
                }}
                disabled={pending}
                className="ml-auto rounded-full px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Ištrinti
              </button>
            )}
          </div>
        )}
      </form>
    </dialog>
  );
}

type CustomerNameFieldProps = {
  id: string;
  value: string;
  customers: KnownCustomer[];
  onChange: (name: string) => void;
  onPick: (customer: KnownCustomer) => void;
};

const digitsOf = (s: string) => s.replace(/\D/g, "");

/** Vardo laukas su anksčiau įvestų klientų pasiūlymais – ieško pagal vardą arba telefono skaitmenis. */
function CustomerNameField({ id, value, customers, onChange, onPick }: CustomerNameFieldProps) {
  const [open, setOpen] = useState(false);
  // -1 – nė vienas pasiūlymas nepažymėtas (Enter tada išsaugo formą)
  const [active, setActive] = useState(-1);
  const listId = `${id}-list`;
  const thisYear = todayLt().slice(0, 4);

  const query = value.trim().toLowerCase();
  const digits = digitsOf(value);
  const matches = customers
    .filter((c) => !query || c.name.toLowerCase().includes(query) || (digits.length >= 3 && digitsOf(c.phone).includes(digits)))
    .slice(0, 6);
  // Jei įvestas vardas jau sutampa su vieninteliu pasiūlymu – sąrašo nebereikia
  const alreadyPicked = matches.length === 1 && matches[0].name.toLowerCase() === query;
  const visible = open && matches.length > 0 && !alreadyPicked;

  function pick(c: KnownCustomer) {
    onPick(c);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? matches.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      // Uždaro tik sąrašą, ne visą langą
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        maxLength={100}
        autoComplete="off"
        placeholder={customers.length > 0 ? "Įveskite arba pasirinkite" : "Neprivaloma"}
        className={inputClass}
      />
      {visible && (
        <ul
          id={listId}
          role="listbox"
          // Neleidžia laukui prarasti fokuso, kol paspaudžiamas pasiūlymas
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-pine-900/15 bg-white py-1 shadow-lg"
        >
          {matches.map((c, i) => (
            <li
              key={`${c.name}|${c.phone}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onClick={() => pick(c)}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-pine-50" : ""}`}
            >
              <span className="block text-sm font-semibold text-pine-900">{c.name}</span>
              <span className="block text-xs text-pine-700">
                {[c.phone, c.lastDate && `pask. ${formatDate(c.lastDate, { year: c.lastDate.startsWith(thisYear) ? undefined : "numeric" })}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
