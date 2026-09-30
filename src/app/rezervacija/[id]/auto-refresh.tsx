"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Kol laukiama mokėjimo patvirtinimo (webhook), kas kelias sekundes atnaujina puslapį. */
export function AutoRefresh({ intervalMs = 4000, maxTimes = 15 }: { intervalMs?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      if (++count > maxTimes) return clearInterval(timer);
      router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs, maxTimes]);
  return null;
}
