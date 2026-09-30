import "server-only";
import type { Reservation, Sector } from "@prisma/client";
import { createMontonioOrder, montonioConfigured } from "@/lib/payments/montonio";
import { prisma } from "@/lib/db";
import { formatDate, pluralParos } from "@/lib/format";
import { site } from "@/content/site";

export type PaymentProvider = "montonio" | "mock";

export function activePaymentProvider(): PaymentProvider {
  return montonioConfigured() ? "montonio" : "mock";
}

/** Testinis mokėjimas leidžiamas tik kūrimo aplinkoje arba aiškiai įjungus. */
export function mockPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "true";
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Sukuria mokėjimą ir grąžina adresą, į kurį reikia nukreipti pirkėją. */
export async function startPayment(reservation: Reservation & { sector: Sector }): Promise<string> {
  const provider = activePaymentProvider();

  if (provider === "montonio") {
    const order = await createMontonioOrder({
      merchantReference: reservation.id,
      amountCents: reservation.totalCents,
      description: `${site.shortName}: sektorius Nr. ${reservation.sector.number}, ${formatDate(reservation.dateFrom)}, ${pluralParos(reservation.days)}`,
      customer: {
        name: reservation.customerName,
        email: reservation.customerEmail,
        phone: reservation.customerPhone,
      },
      returnUrl: `${siteUrl()}/api/montonio/return`,
      notificationUrl: `${siteUrl()}/api/montonio/webhook`,
    });
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { paymentProvider: "montonio", paymentOrderId: order.uuid },
    });
    return order.paymentUrl;
  }

  if (!mockPaymentsAllowed()) {
    throw new Error("Mokėjimai nesukonfigūruoti: nustatykite MONTONIO_ACCESS_KEY ir MONTONIO_SECRET_KEY.");
  }
  await prisma.reservation.update({ where: { id: reservation.id }, data: { paymentProvider: "mock" } });
  return `/mokejimas/testas/${reservation.id}`;
}
