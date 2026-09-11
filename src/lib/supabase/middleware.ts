import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // API routes authenticate bearer/cookie sessions themselves.
  if (request.nextUrl.pathname.startsWith("/api/"))
    return NextResponse.next({ request });
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this triggers token refresh if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Deny internal routes before streaming starts, including RSC requests.
  if (
    request.nextUrl.pathname === "/internal" ||
    request.nextUrl.pathname.startsWith("/internal/")
  ) {
    const ownerId = process.env.WANTIO_ADMIN_USER_ID?.trim();
    if (!ownerId || !user || user.id !== ownerId) {
      return new NextResponse("Not found", {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex",
        },
      });
    }
  }

  // Redirect unauthenticated users to login (except public routes)
  if (
    !user &&
    request.nextUrl.pathname !== "/" &&
    !["/extension", "/privacy"].includes(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/shared")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
