import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Viešos svetainės puslapiai – su meniu ir poraštės informacija. Administravimas turi savo maketą.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
