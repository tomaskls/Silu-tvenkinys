import Link from "next/link";
import { site } from "@/content/site";
import { logoutAction } from "../actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-pine-950 text-white">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="truncate font-display text-lg font-semibold">
            {site.shortName}{" "}
            <span className="hidden font-sans text-sm font-normal text-pine-100/70 sm:inline">· administravimas</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm">
            <Link href="/rezervacija" target="_blank" className="rounded-full px-3 py-1.5 text-pine-100 hover:bg-white/10">
              Svetainė ↗
            </Link>
            <form action={logoutAction}>
              <button className="rounded-full px-3 py-1.5 text-pine-100 hover:bg-white/10">Atsijungti</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-sand-50">{children}</main>
    </>
  );
}
