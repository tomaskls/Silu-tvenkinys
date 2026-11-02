import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Prisijungimas", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/admin/prisijungti">) {
  const { next } = await props.searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-pine-950 px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-wood-600">Administravimas</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-pine-900">{site.shortName}</h1>
        <p className="mt-2 text-sm text-pine-700">Prisijunkite, kad galėtumėte žymėti sektorių užimtumą.</p>
        <LoginForm next={typeof next === "string" ? next : ""} />
      </div>
      <Link href="/" className="mt-6 text-sm text-pine-100/70 hover:text-white">
        ← Grįžti į svetainę
      </Link>
    </main>
  );
}
