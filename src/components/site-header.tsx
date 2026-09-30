"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/content/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-pine-900/10 bg-sand-50/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span aria-hidden className="grid size-9 place-items-center rounded-full bg-pine-900 text-sand-50">
            <FishIcon />
          </span>
          <span className="font-display text-lg font-semibold leading-tight text-pine-900">{site.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Pagrindinis meniu">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href) ? "bg-pine-100 text-pine-900" : "text-pine-800 hover:bg-pine-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/rezervacija"
            className="ml-2 rounded-full bg-wood-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wood-600"
          >
            Rezervuoti sektorių
          </Link>
        </nav>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-pine-900 hover:bg-pine-50 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Uždaryti meniu" : "Atidaryti meniu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-pine-900/10 bg-sand-50 md:hidden" aria-label="Mobilus meniu">
          <div className="container-page flex flex-col py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 font-medium ${isActive(item.href) ? "bg-pine-100" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/rezervacija"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-wood-500 px-4 py-3 text-center font-semibold text-white"
            >
              Rezervuoti sektorių
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function FishIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c3-4 7-6 11-6 4 0 7 3 8 6-1 3-4 6-8 6-4 0-8-2-11-6z" />
      <path d="M5 9L2 6M5 15l-3 3" />
      <circle cx="16.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}
