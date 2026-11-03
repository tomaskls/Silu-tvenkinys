"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { SectorAvailability } from "@/lib/reservations";
import { addDays, diffDays, formatDate, formatMoney, pluralParos } from "@/lib/format";
import { site } from "@/content/site";
import { SectorMap } from "@/components/sector-map";

type Props = {
  today: string;
  initialMonth: string;
  initialMonthCounts: Record<string, number>;
  initialSectors: SectorAvailability[];
  maxDays: number;
  bookingWindowDays: number;
};

const WEEKDAYS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
// Kas kiek laiko atvirame puslapyje atnaujinamas užimtumas (administratoriaus pakeitimai)
const REFRESH_MS = 60_000;

export function OccupancyView(props: Props) {
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
  // Atsakymas į senesnę užklausą neturi perrašyti naujesnės
  const sectorsRequest = useRef(0);

  const selected = sectors.find((s) => s.id === sectorId && s.available) ?? null;
  const dateTo = addDays(dateFrom, days);

  const fetchSectors = useCallback(async (from: string, n: number) => {
    const request = ++sectorsRequest.current;
    try {
      const res = await fetch(`/api/availability?from=${from}&days=${n}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nepavyko gauti užimtumo");
      if (request !== sectorsRequest.current) return;
      setSectors(data.sectors);
      setLoadError(null);
    } catch (e) {
      if (request === sectorsRequest.current) setLoadError(e instanceof Error ? e.message : "Nepavyko gauti užimtumo");
    }
  }, []);

  const fetchMonth = useCallback(async (m: string) => {
    try {
      const res = await fetch(`/api/availability?month=${m}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setMonthCounts((prev) => ({ ...prev, [m]: data.days }));
    } catch {
      // Kalendoriaus spalvos neprivalomos – tyliai ignoruojame
    }
  }, []);

  // Fone atnaujiname užimtumą, kad administratoriaus pakeitimai matytųsi neperkrovus puslapio
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetchSectors(dateFrom, days);
      fetchMonth(month);
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [dateFrom, days, month, fetchSectors, fetchMonth]);

  function loadSectors(from: string, n: number) {
    startSectorsTransition(() => fetchSectors(from, n));
  }

  function loadMonth(m: string) {
    setMonth(m);
    if (!monthCounts[m]) fetchMonth(m);
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
    // Kompiuteryje data ir sektoriai – greta (telpa viename ekrane), skambinimo kortelė – po jais per visą plotį
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* 1. Data */}
      <Step n={1} title="Kada norite atvykti?">
        <div className="grid gap-6 md:grid-cols-[1fr_200px] lg:grid-cols-1">
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
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
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
            </div>
            {/* Kompiuteryje datos matomos skambinimo kortelėje po žingsniais */}
            <dl className="space-y-1 rounded-xl bg-sand-100 p-4 text-sm lg:hidden">
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

      {/* 2. Sektoriai */}
      <Step n={2} title="Laisvi sektoriai">
        <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
          <Legend className="bg-emerald-600" label="Laisvas" />
          <Legend className="bg-red-600" label="Užimtas" />
          <span className="ml-auto text-pine-700" aria-live="polite">
            {loadingSectors ? "Tikrinamas užimtumas…" : `Laisva: ${freeCount} iš ${sectors.length}`}
          </span>
        </div>
        <div className={loadingSectors ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <SectorMap sectors={mapSectors} onSelect={setSectorId} />
        </div>
        {loadError && <p className="mt-3 text-sm text-red-700">{loadError}</p>}
      </Step>

      {/* Rezervacija telefonu */}
      <aside className="rounded-2xl border border-pine-900/10 bg-white p-6 shadow-sm lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem_16rem] lg:items-center lg:gap-x-10 lg:gap-y-2">
        <div className="lg:self-end">
          <h2 className="font-display text-2xl font-semibold text-pine-900">Rezervacija telefonu</h2>
          <p className="mt-2 text-sm leading-relaxed text-pine-800">
            Paskambinkite ir pasakykite norimą sektorių bei datas. Rezervaciją pažymėsime iš karto – sektorius šiame
            puslapyje taps užimtas.
          </p>
        </div>
        <dl className="mt-5 space-y-3 text-sm lg:row-span-2 lg:mt-0 lg:space-y-1.5">
          <Row label="Sektorius" value={selected ? `Nr. ${selected.number}` : "—"} />
          <Row label="Atvykimas" value={`${formatDate(dateFrom)}, ${site.booking.checkInTime}`} />
          <Row label="Išvykimas" value={`${formatDate(dateTo)}, ${site.booking.checkOutTime}`} />
          <Row label="Trukmė" value={pluralParos(days)} />
        </dl>
        <div className="mt-5 lg:row-span-2 lg:mt-0">
          <div className="flex items-baseline justify-between border-t border-pine-900/10 pt-5 lg:border-t-0 lg:pt-0">
            <span className="font-semibold">Kaina</span>
            <span className="font-display text-3xl font-semibold text-pine-900">
              {selected ? formatMoney(selected.pricePerDay * days) : "—"}
            </span>
          </div>
          <a
            href={site.phoneHref}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-wood-500 px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-wood-600 lg:mt-3"
          >
            <PhoneIcon />
            {site.phone}
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-pine-700 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-start">
          {selected
            ? `Sektorius Nr. ${selected.number} šiuo metu laisvas. Užimtumas keičiasi – patvirtinsime skambučio metu.`
            : freeCount > 0
              ? "Pasirinkite laisvą sektorių žemėlapyje."
              : "Šiomis dienomis laisvų sektorių nėra – pasirinkite kitą datą."}
        </p>
      </aside>
    </div>
  );
}

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

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
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
            free === undefined ? "" : free === 0 ? "bg-red-100 text-red-700" : free < sectorCount / 2 ? "bg-amber-100" : "bg-emerald-50";
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              title={free !== undefined && !disabled ? `Laisvų sektorių: ${free}` : undefined}
              className={`relative aspect-square rounded-lg text-sm lg:aspect-auto lg:h-11 transition-colors disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-300 ${
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
