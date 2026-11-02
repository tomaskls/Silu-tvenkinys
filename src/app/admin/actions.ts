"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, isAdmin, startAdminSession } from "@/lib/admin-auth";
import { checkCredentials, credentialsConfigured, LOGIN_PATH } from "@/lib/admin-session";
import { deleteReservation, ReservationError, reservationInputSchema, saveReservation } from "@/lib/reservations";

// user grąžinamas, kad po klaidos nereikėtų jo vesti iš naujo
export type LoginState = { error?: string; user?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!credentialsConfigured())
    return { error: "Prisijungimas nesukonfigūruotas: nustatykite ADMIN_USER ir ADMIN_PASSWORD." };

  const user = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(user, password)) {
    // Pristabdome, kad slaptažodžio spėliojimas būtų lėtas
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Neteisingas vartotojo vardas arba slaptažodis.", user };
  }

  await startAdminSession();
  const next = String(formData.get("next") ?? "");
  // Nukreipiame tik į administravimo puslapius, kad nebūtų galima nukreipti į svetimą svetainę
  redirect(next.startsWith("/admin") && next !== LOGIN_PATH ? next : "/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect(LOGIN_PATH);
}

export type ActionResult = { error?: string };

const SESSION_EXPIRED = "Sesija baigėsi – perkraukite puslapį ir prisijunkite iš naujo.";

// Užimtumas viešai rodomas /rezervacija ir pradžios puslapyje – atnaujiname juos kartu su administravimu
function revalidateOccupancy() {
  revalidatePath("/admin");
  revalidatePath("/rezervacija");
  revalidatePath("/");
}

export async function saveReservationAction(input: unknown): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  const parsed = reservationInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Neteisingi duomenys." };

  try {
    await saveReservation(parsed.data);
  } catch (e) {
    if (e instanceof ReservationError) return { error: e.message };
    console.error("Rezervacijos išsaugojimo klaida", e);
    return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };
  }
  revalidateOccupancy();
  return {};
}

export async function deleteReservationAction(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  await deleteReservation(id);
  revalidateOccupancy();
  return {};
}
