import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  // Serverio veiksmai (POST) autorizaciją tikrina patys ir grąžina aiškią klaidą, o ne nukreipimą
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    return loggedIn ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }
  if (loggedIn) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (pathname + search !== "/admin") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
