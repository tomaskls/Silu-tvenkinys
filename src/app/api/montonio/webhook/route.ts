import { NextResponse } from "next/server";
import { verifyMontonioToken } from "@/lib/payments/montonio";
import { markReservationPaid } from "@/lib/reservations";

// Montonio siunčia POST { orderToken } kiekvieną kartą, kai pasikeičia užsakymo būsena.
export async function POST(request: Request) {
  let orderToken: unknown;
  try {
    ({ orderToken } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (typeof orderToken !== "string") return NextResponse.json({ error: "Missing orderToken" }, { status: 400 });

  let order;
  try {
    order = await verifyMontonioToken(orderToken);
  } catch (e) {
    console.error("Montonio webhook: netinkamas token", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (order.paymentStatus === "PAID") {
    const reservation = await markReservationPaid(order.merchantReference, "montonio", order.uuid);
    if (!reservation) console.error("Montonio webhook: rezervacija nerasta", order.merchantReference);
  }

  return NextResponse.json({ ok: true });
}
