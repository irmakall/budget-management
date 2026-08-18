import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";



function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((c) => target.cookies.set(c.name, c.value, c));
  return target;
}


export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";

  const protectedPaths = ["/dashboard", "/settings"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCookies(NextResponse.redirect(url), response);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withCookies(NextResponse.redirect(url), response);
  }

  return response;
}