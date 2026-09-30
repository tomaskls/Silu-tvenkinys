"use server";

import { redirect } from "next/navigation";
import { createPendingReservation, ReservationError, reservationInputSchema } from "@/lib/reservations";
import { startPayment } from "@/lib/payments";

export type BookingState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export async function createReservationAction(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const parsed = reservationInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Patikrinkite pažymėtus laukus.", fieldErrors };
  }

  let paymentUrl: string;
  try {
    const reservation = await createPendingReservation(parsed.data);
    paymentUrl = await startPayment(reservation);
  } catch (e) {
    if (e instanceof ReservationError) return { error: e.message };
    console.error("Rezervacijos klaida", e);
    return { error: "Įvyko klaida. Bandykite dar kartą arba susisiekite telefonu." };
  }

  // redirect() meta specialią išimtį, todėl kviečiamas už try/catch ribų
  redirect(paymentUrl);
}
