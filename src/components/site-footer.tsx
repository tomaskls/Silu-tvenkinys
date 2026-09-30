import Link from "next/link";
import { nav, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-pine-950 text-pine-100">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold text-white">{site.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-pine-100/80">{site.tagline}.</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-wood-400">Puslapiai</p>
          <ul className="mt-3 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rezervacija" className="hover:text-white">
                Sektorių rezervacija
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-wood-400">Kontaktai</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={site.phoneHref} className="hover:text-white">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li className="text-pine-100/80">{site.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-pine-100/60">
          © {new Date().getFullYear()} {site.name}. Žvejoti tik su leidimais.
        </div>
      </div>
    </footer>
  );
}
