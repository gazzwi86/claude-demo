import { type NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "looper_auth";

const PROTECTED = ["/studio", "/dashboard", "/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (request.cookies.has(AUTH_COOKIE)) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/studio/:path*", "/dashboard/:path*", "/account/:path*"],
};
