import "server-only";
import { jwtVerify, SignJWT } from "jose";

// Montonio Stargate API (v2) – https://docs.montonio.com/api/stargate/guides/orders
// Užsakymo duomenys pasirašomi JWT (HS256) su slaptuoju raktu, Montonio grąžina paymentUrl,
// į kurį nukreipiamas pirkėjas. Po apmokėjimo Montonio siunčia webhook su orderToken (JWT).

const SANDBOX_URL = "https://sandbox-stargate.montonio.com";
const PRODUCTION_URL = "https://stargate.montonio.com";

export function montonioConfigured(): boolean {
  return Boolean(process.env.MONTONIO_ACCESS_KEY && process.env.MONTONIO_SECRET_KEY);
}

function config() {
  const accessKey = process.env.MONTONIO_ACCESS_KEY;
  const secretKey = process.env.MONTONIO_SECRET_KEY;
  if (!accessKey || !secretKey) throw new Error("Montonio raktai nenustatyti (MONTONIO_ACCESS_KEY / MONTONIO_SECRET_KEY)");
  const baseUrl = process.env.MONTONIO_ENV === "production" ? PRODUCTION_URL : SANDBOX_URL;
  return { accessKey, secret: new TextEncoder().encode(secretKey), baseUrl };
}

export type MontonioOrderInput = {
  merchantReference: string;
  amountCents: number;
  description: string;
  customer: { name: string; email: string; phone: string };
  returnUrl: string;
  notificationUrl: string;
};

export async function createMontonioOrder(input: MontonioOrderInput): Promise<{ paymentUrl: string; uuid: string }> {
  const { accessKey, secret, baseUrl } = config();
  const amount = Number((input.amountCents / 100).toFixed(2));
  const [firstName, ...rest] = input.customer.name.split(" ");

  const payload = {
    accessKey,
    merchantReference: input.merchantReference,
    returnUrl: input.returnUrl,
    notificationUrl: input.notificationUrl,
    currency: "EUR",
    grandTotal: amount,
    locale: "lt",
    billingAddress: {
      firstName,
      lastName: rest.join(" ") || firstName,
      email: input.customer.email,
      phoneNumber: input.customer.phone,
    },
    lineItems: [{ name: input.description, quantity: 1, finalPrice: amount }],
    payment: {
      method: "paymentInitiation",
      methodDisplay: "Mokėjimas per banką",
      amount,
      currency: "EUR",
      methodOptions: { preferredCountry: "LT", preferredLocale: "lt" },
    },
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: token }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Montonio klaida ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { paymentUrl: string; uuid: string };
  return { paymentUrl: data.paymentUrl, uuid: data.uuid };
}

export type MontonioOrderToken = {
  uuid: string;
  accessKey: string;
  merchantReference: string;
  paymentStatus: "PAID" | "PENDING" | "ABANDONED" | "VOIDED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "AUTHORIZED";
  grandTotal: number;
  currency: string;
};

/** Patikrina Montonio orderToken parašą ir grąžina jo turinį. */
export async function verifyMontonioToken(token: string): Promise<MontonioOrderToken> {
  const { accessKey, secret } = config();
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  const data = payload as unknown as MontonioOrderToken;
  if (data.accessKey !== accessKey) throw new Error("Montonio token priklauso kitai parduotuvei");
  return data;
}
