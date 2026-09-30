"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import type { SectorAvailability } from "@/lib/reservations";
import { addDays, diffDays, formatDate, formatMoney, pluralParos } from "@/lib/format";
import { SectorMap } from "@/components/sector-map";
import { createReservationAction, type BookingState } from "./actions";

type Props = {
  today: string;
  initialMonth: string;
  initialMonthCounts: Record<string, number>;
  initialSectors: SectorAvailability[];
  maxDays: number;
  bookingWindowDays: number;
  holdMinutes: number;
};

const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

export function BookingForm(props: Props) {
  const { today, maxDays, bookingWindowDays } = props;
  const lastBookable = addDays(today, bookingWindowDays);
  const sectorCount = props.initialSectors.length;

  const [dateFrom, setDateFrom] = useState(today);
  const [days, setDays] = useState(1);
  const [sectors, setSectors] = useState(props.initialSectors);
  const [sectorId, setSectorId] = useState<number | null>(null);
  const [month, setMonth] = useState(props.initialMonth);
  const [monthCounts, setMonthCounts] = useState<Record<string, Record<string, number>>>({
    [props.initialMonth]: props.initialMonthCounts,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingSectors, startSectorsTransition] = useTransition();
  const [customer, setCustomer] = useState({ customerName: "", customerEmail: "", customerPhone: "", anglers: "1", notes: "" });
  const [state, formAction, submitting] = useActionState<BookingState, FormData>(createReservationAction, {});

  const selected = sectors.find((s) => s.id === sectorId && s.available) ?? null;
  const dateTo = addDays(dateFrom, days);

  function loadSectors(from: string, n: number) {
    startSectorsTransition(async () => {
      try {
        const res = await fetch(`/api/availability?from=${from}&days=${n}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Nepavyko gauti užimtumo");
        setSectors(data.sectors);
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Nepavyko gauti užimtumo");
      }
    });
  }

  async function loadMonth(m: string) {
    setMonth(m);
    if (monthCounts[m]) return;
    try {
      const res = await fetch(`/api/availability?month=${m}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setMonthCounts((prev) => ({ ...prev, [m]: data.days }));
    } catch {
      // Kalendoriaus spalvos neprivalomos – tyliai ignoruojame
    }
  }

  function pickDate(d: string) {
    setDateFrom(d);
    loadSectors(d, days);
  }

  function pickDays(n: number) {
    setDays(n);
    loadSectors(dateFrom, n);
  }

  const mapSectors = sectors.map((s) => ({
    id: s.id,
    number: s.number,
    state: (s.id === selected?.id ? "selected" : s.available ? "free" : "taken") as "selected" | "free" | "taken",
  }));
  const freeCount = sectors.filter((s) => s.available).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        {/* 1. Data */}
        <Step n={1} title="Atvykimo diena ir trukmė">
          <div className="grid gap-6 md:grid-cols-[1fr_200px]">
            <Calendar
              month={month}
              today={today}
              lastBookable={lastBookable}
              counts={monthCounts[month]}
              sectorCount={sectorCount}
              rangeFrom={dateFrom}
              rangeTo={dateTo}
              onMonthChange={loadMonth}
              onPick={pickDate}
            />
            <div>
              <label htmlFor="days" className="text-sm font-semibold text-pine-900">
                Parų skaičius
              </label>
              <select
                id="days"
                value={days}
                onChange={(e) => pickDays(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-pine-900/20 bg-white px-3 py-2.5"
              >
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {pluralParos(n)}
                  </option>
                ))}
              </select>
              <dl className="mt-4 space-y-1 rounded-xl bg-sand-100 p-4 text-sm">
                <div>
                  <dt className="inline text-pine-700">Atvykimas: </dt>
                  <dd className="inline font-semibold">{formatDate(dateFrom)}</dd>
                </div>
                <div>
                  <dt className="inline text-pine-700">Išvykimas: </dt>
                  <dd className="inline font-semibold">{formatDate(dateTo)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Step>

        {/* 2. Sektorius */}
        <Step n={2} title="Pasirinkite sektorių">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <Legend className="bg-emerald-600" label="Laisvas" />
            <Legend className="bg-stone-400" label="Užimtas" />
            <Legend className="bg-wood-500" label="Pasirinktas" />
            <span className="ml-auto text-pine-700" aria-live="polite">
              {loadingSectors ? "Tikrinamas užimtumas…" : `Laisva: ${freeCount} iš ${sectors.length}`}
            </span>
          </div>
          <div className={loadingSectors ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <SectorMap sectors={mapSectors} onSelect={setSectorId} />
          </div>
          {loadError && <p className="mt-3 text-sm text-red-700">{loadError}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {sectors.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!s.available}
                onClick={() => setSectorId(s.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  s.id === selected?.id
                    ? "border-wood-500 bg-wood-100"
                    : s.available
                      ? "border-pine-900/15 bg-white hover:border-pine-700"
                      : "cursor-not-allowed border-transparent bg-stone-100 text-stone-400"
                }`}
              >
                <span className="block font-semibold">Nr. {s.number}</span>
                <span className="block">{s.available ? formatMoney(s.pricePerDay) + " / para" : "Užimtas"}</span>
              </button>
            ))}
          </div>
        </Step>

        {/* 3. Duomenys */}
        <Step n={3} title="Jūsų duomenys">
          <form id="booking" action={formAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="sectorId" value={selected?.id ?? ""} />
            <input type="hidden" name="dateFrom" value={dateFrom} />
            <input type="hidden" name="days" value={days} />
            <Field label="Vardas ir pavardė" error={state.fieldErrors?.customerName}>
              <input
                name="customerName"
                required
                autoComplete="name"
                value={customer.customerName}
                onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Telefonas" error={state.fieldErrors?.customerPhone}>
              <input
                name="customerPhone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+370 6xx xxxxx"
                value={customer.customerPhone}
                onChange={(e) => setCustomer({ ...customer, customerPhone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="El. paštas" error={state.fieldErrors?.customerEmail}>
              <input
                name="customerEmail"
                type="email"
                required
                autoComplete="email"
                value={customer.customerEmail}
                onChange={(e) => setCustomer({ ...customer, customerEmail: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Žvejų skaičius" error={state.fieldErrors?.anglers}>
              <select
                name="anglers"
                value={customer.anglers}
                onChange={(e) => setCustomer({ ...customer, anglers: e.target.value })}
                className={inputClass}
              >
                {Array.from({ length: selected?.maxAnglers ?? 2 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Pastabos (neprivaloma)" error={state.fieldErrors?.notes}>
                <textarea
                  name="notes"
                  rows={3}
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input type="checkbox" name="acceptRules" required className="mt-0.5 size-4 accent-pine-800" />
              <span>
                Susipažinau ir sutinku su{" "}
                <Link href="/taisykles" target="_blank" className="font-semibold text-lake-700 underline">
                  žvejybos taisyklėmis
                </Link>
                .
                {state.fieldErrors?.acceptRules && (
                  <span className="block text-red-700">{state.fieldErrors.acceptRules}</span>
                )}
              </span>
            </label>
          </form>
        </Step>
      </div>

      {/* Suvestinė */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-pine-900/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-pine-900">Jūsų rezervacija</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Sektorius" value={selected ? `Nr. ${selected.number}` : "—"} />
            <Row label="Atvykimas" value={formatDate(dateFrom)} />
            <Row label="Išvykimas" value={formatDate(dateTo)} />
            <Row label="Trukmė" value={pluralParos(days)} />
            {selected && <Row label="Kaina už parą" value={formatMoney(selected.pricePerDay)} />}
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-pine-900/10 pt-5">
            <span className="font-semibold">Iš viso</span>
            <span className="font-display text-3xl font-semibold text-pine-900">
              {selected ? formatMoney(selected.pricePerDay * days) : "—"}
            </span>
          </div>

          {state.error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            form="booking"
            disabled={!selected || submitting || loadingSectors}
            className="mt-5 w-full rounded-full bg-wood-500 px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {submitting ? "Ruošiamas apmokėjimas…" : selected ? "Pereiti prie apmokėjimo" : "Pasirinkite sektorių"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-pine-700">
            Sektorius jums rezervuojamas {props.holdMinutes} min. apmokėjimui atlikti. Rezervacija patvirtinama gavus
            apmokėjimą.
          </p>
        </div>
      </aside>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-pine-900/20 bg-white px-3 py-2.5 outline-none focus:border-lake-600 focus:ring-2 focus:ring-lake-100";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-pine-900/10 bg-white p-5 sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-pine-900">
        <span className="grid size-8 place-items-center rounded-full bg-pine-900 text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-pine-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-pine-700">{label}</dt>
      <dd className="text-right font-semibold text-pine-900">{value}</dd>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

type CalendarProps = {
  month: string; // YYYY-MM
  today: string;
  lastBookable: string;
  counts?: Record<string, number>;
  sectorCount: number;
  rangeFrom: string;
  rangeTo: string;
  onMonthChange: (month: string) => void;
  onPick: (date: string) => void;
};

function Calendar({ month, today, lastBookable, counts, sectorCount, rangeFrom, rangeTo, onMonthChange, onPick }: CalendarProps) {
  const first = `${month}-01`;
  const cells = useMemo(() => {
    // Pirmadienis – savaitės pradžia
    const weekday = (new Date(first + "T00:00:00Z").getUTCDay() + 6) % 7;
    const nextMonthFirst = addDays(first, 32).slice(0, 8) + "01";
    const total = diffDays(first, nextMonthFirst);
    return [
      ...Array.from({ length: weekday }, () => null),
      ...Array.from({ length: total }, (_, i) => addDays(first, i)),
    ];
  }, [first]);

  const prevMonth = addDays(first, -1).slice(0, 7);
  const nextMonth = addDays(first, 32).slice(0, 7);
  const canPrev = prevMonth >= today.slice(0, 7);
  const canNext = nextMonth <= lastBookable.slice(0, 7);
  const title = new Intl.DateTimeFormat("lt-LT", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(first + "T00:00:00Z"),
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(prevMonth)}
          disabled={!canPrev}
          aria-label="Ankstesnis mėnuo"
          className="grid size-9 place-items-center rounded-full hover:bg-pine-50 disabled:opacity-30"
        >
          ‹
        </button>
        <p className="font-semibold capitalize text-pine-900">{title}</p>
        <button
          type="button"
          onClick={() => onMonthChange(nextMonth)}
          disabled={!canNext}
          aria-label="Kitas mėnuo"
          className="grid size-9 place-items-center rounded-full hover:bg-pine-50 disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-pine-700">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const disabled = d < today || d > lastBookable;
          const free = counts?.[d];
          const inRange = d >= rangeFrom && d < rangeTo;
          const isStart = d === rangeFrom;
          const availability =
            free === undefined ? "" : free === 0 ? "bg-stone-200 text-stone-500" : free < sectorCount / 2 ? "bg-amber-100" : "bg-emerald-50";
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              title={free !== undefined && !disabled ? `Laisvų sektorių: ${free}` : undefined}
              className={`relative aspect-square rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-300 ${
                isStart
                  ? "bg-wood-500 font-bold text-white"
                  : inRange
                    ? "bg-wood-100 font-semibold text-wood-600"
                    : `${availability} hover:ring-2 hover:ring-pine-700`
              }`}
            >
              {Number(d.slice(8))}
              {free !== undefined && !disabled && !isStart && (
                <span className="absolute inset-x-0 bottom-0.5 text-[10px] leading-none opacity-70">{free}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-pine-700">Mažas skaičius – laisvų sektorių kiekis tą dieną.</p>
    </div>
  );
}
