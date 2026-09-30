"use server";

import { notFound, redirect } from "next/navigation";
import { markReservationPaid } from "@/lib/reservations";
import { mockPaymentsAllowed } from "@/lib/payments";

export async function mockPayAction(id: string) {
  if (!mockPaymentsAllowed()) notFound();
  await markReservationPaid(id, "mock", `mock-${Date.now()}`);
  redirect(`/rezervacija/${id}`);
}
