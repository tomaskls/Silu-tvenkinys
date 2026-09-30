import { NextResponse } from "next/server";
import { verifyMontonioToken } from "@/lib/payments/montonio";
import { markReservationPaid } from "@/lib/reservations";
import { siteUrl } from "@/lib/payments";

// Po apmokėjimo Montonio grąžina pirkėją čia su ?order-token=...
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("order-token");
  if (!token) return NextResponse.redirect(`${siteUrl()}/rezervacija`);

  try {
    const order = await verifyMontonioToken(token);
    if (order.paymentStatus === "PAID") {
      await markReservationPaid(order.merchantReference, "montonio", order.uuid);
    }
    return NextResponse.redirect(`${siteUrl()}/rezervacija/${encodeURIComponent(order.merchantReference)}`);
  } catch (e) {
    console.error("Montonio return: netinkamas token", e);
    return NextResponse.redirect(`${siteUrl()}/rezervacija`);
  }
}
