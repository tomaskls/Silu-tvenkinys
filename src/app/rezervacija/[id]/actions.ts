"use server";

import { redirect } from "next/navigation";
import { getReservation } from "@/lib/reservations";
import { startPayment } from "@/lib/payments";

export async function retryPaymentAction(id: string) {
  const reservation = await getReservation(id);
  if (!reservation || reservation.status !== "PENDING" || reservation.holdUntil < new Date()) {
    redirect(`/rezervacija/${id}`);
  }
  redirect(await startPayment(reservation));
}
