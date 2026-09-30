"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

// Server actions pasiekiami tiesiogiai POST užklausa, todėl autorizaciją tikriname ir čia, ne tik proxy.ts
async function requireAdmin() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) throw new Error("Neautorizuota");
}

export async function setReservationStatusAction(id: string, status: "PAID" | "CANCELLED") {
  await requireAdmin();
  await prisma.reservation.update({
    where: { id },
    data: status === "PAID" ? { status, paidAt: new Date(), paymentProvider: "rankinis" } : { status },
  });
  revalidatePath("/admin");
}
