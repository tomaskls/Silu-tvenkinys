"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { AdminReservation } from "@/lib/reservations";
import { addDays, diffDays, formatDate, formatDateRange, isIsoDate, pluralParos } from "@/lib/format";
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
  maxDays: number;
};

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

export function ReservationsBoard({ today, start, days, sectors, reservations, upcoming, maxDays }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  // Kiekvienas atidarymas – nauja formos būsena
  const [dialogKey, setDialogKey] = useState(0);

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
        onCreate={(sectorId, date) => openNew([sectorId], date)}
        onEdit={openEdit}
      />
      <p className="mt-2 text-xs leading-relaxed text-pine-700">
        Paspauskite laisvą langelį – pažymėsite sektorių užimtu. Paspauskite rezervaciją – galėsite ją pakeisti arba
        ištrinti. Juosta rodo paras: išvykimo dieną (nuo {site.booking.checkOutTime}) sektorius jau laisvas.
      </p>

      <UpcomingList upcoming={upcoming} today={today} onEdit={openEdit} />

      {draft && (
        <ReservationDialog
          key={dialogKey}
          draft={draft}
          sectors={sectors}
          known={known}
          maxDays={maxDays}
          onClose={() => setDraft(null)}
        />
      )}
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
  onCreate: (sectorId: number, date: string) => void;
  onEdit: (r: AdminReservation) => void;
};

function OccupancyGrid({ start, days, today, sectors, reservations, onCreate, onEdit }: GridProps) {
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);
  const end = addDays(start, days);
  const columns = { gridTemplateColumns: `4.5rem repeat(${days}, minmax(3.25rem, 1fr))` };

  const dayTint = (d: string) => (d === today ? "bg-lake-100/60" : d < today ? "bg-stone-100/70" : weekdayIndex(d) >= 5 ? "bg-sand-100/70" : "");

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-pine-900/10 bg-white">
      <div style={{ minWidth: `calc(4.5rem + ${days} * 3.25rem)` }}>
        {/* Datų antraštė */}
        <div className="grid border-b border-pine-900/10 bg-sand-100 text-center" style={columns}>
          <div className="sticky left-0 z-20 bg-sand-100" />
          {dates.map((d, i) => {
            const wd = weekdayIndex(d);
            return (
              <div
                key={d}
                className={`border-l border-pine-900/10 px-1 py-1.5 ${
                  d === today ? "bg-lake-100 text-lake-700" : wd >= 5 ? "text-wood-600" : "text-pine-800"
                }`}
              >
                <div className="text-[11px] font-semibold">{WEEKDAYS[wd]}</div>
                <div className="font-display text-lg font-semibold leading-tight">{Number(d.slice(8))}</div>
                <div className="h-3 text-[10px] leading-none opacity-80">
                  {i === 0 || d.endsWith("-01") ? MONTHS_SHORT[Number(d.slice(5, 7)) - 1] : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sektoriai */}
        {sectors.map((s) => (
          <div key={s.id} className="grid border-b border-pine-900/10 last:border-b-0" style={columns}>
            <div
              style={{ gridColumn: 1, gridRow: 1 }}
              className="sticky left-0 z-20 flex items-center border-r border-pine-900/10 bg-white px-3 text-sm font-semibold text-pine-900"
            >
              Nr. {s.number}
            </div>
            {dates.map((d, i) => (
              <button
                key={d}
                type="button"
                style={{ gridColumn: i + 2, gridRow: 1 }}
                onClick={() => onCreate(s.id, d)}
                aria-label={`Sektorius ${s.number}, ${formatDate(d)}: pažymėti užimtu`}
                className={`h-12 border-l border-pine-900/10 transition-colors first-of-type:border-l-0 hover:bg-emerald-100 ${dayTint(d)}`}
              />
            ))}
            {reservations
              .filter((r) => r.sectorId === s.id)
              .map((r) => {
                const from = Math.max(0, diffDays(start, r.dateFrom));
                const to = Math.min(days, diffDays(start, r.dateTo));
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onEdit(r)}
                    title={describe(r)}
                    style={{ gridColumn: `${from + 2} / ${to + 2}`, gridRow: 1 }}
                    className={`z-10 my-1.5 flex min-w-0 items-center bg-wood-500 px-2 text-left text-xs font-semibold text-white shadow-sm transition-colors hover:bg-wood-600 ${
                      r.dateFrom < start ? "" : "ml-1 rounded-l-lg"
                    } ${r.dateTo > end ? "" : "mr-1 rounded-r-lg"} ${r.dateTo <= today ? "opacity-50" : ""}`}
                  >
                    <span className="truncate">{r.customerName || "Užimta"}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
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
              <span className="w-44 font-semibold text-pine-900">
                {formatDateRange(r.dateFrom, r.dateTo)}
                {r.dateFrom <= today && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">dabar</span>
                )}
              </span>
              <span className="w-14 font-semibold text-wood-600">Nr. {r.sectorNumber}</span>
              <span className="min-w-0 flex-1">
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
                className="rounded-full border border-pine-900/15 px-3 py-1 text-xs font-semibold text-pine-900 hover:bg-pine-50"
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
  maxDays: number;
  onClose: () => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-pine-900/20 bg-white px-3 py-2.5 outline-none focus:border-lake-600 focus:ring-2 focus:ring-lake-100";

function ReservationDialog({ draft, sectors, known, maxDays, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(draft.id);

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
      if (result.error) setError(result.error);
      else close();
    });
  }

  function remove() {
    if (!draft.id || !confirm("Ištrinti šią rezervaciją? Sektorius taps laisvas.")) return;
    const id = draft.id;
    setError(null);
    startTransition(async () => {
      const result = await deleteReservationAction(id);
      if (result.error) setError(result.error);
      else close();
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
            <span className="text-sm font-semibold text-pine-900">Atvykimas</span>
            <input
              type="date"
              required
              value={form.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className={inputClass}
            />
          </label>
          <div>
            <label htmlFor="reservation-days" className="text-sm font-semibold text-pine-900">
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
          <label className="block">
            <span className="text-sm font-semibold text-pine-900">Vardas, pavardė</span>
            <input
              value={form.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
              maxLength={100}
              autoComplete="off"
              placeholder="Neprivaloma"
              className={inputClass}
            />
          </label>
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
            <span className="text-sm font-semibold text-pine-900">Pastabos</span>
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !canSave}
            className="rounded-full bg-wood-500 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {pending ? "Saugoma…" : isEdit ? "Išsaugoti" : "Pažymėti užimtą"}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-pine-900/20 px-5 py-3 font-semibold text-pine-900 hover:bg-pine-50"
          >
            Atšaukti
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="ml-auto rounded-full px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Ištrinti
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
