import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sunucuda calisan Supabase istemcisi.
// Server Component ve Server Action icinde bunu kullaniyoruz.
// Oturum bilgisi cerezde durdugu icin cookie kopruse burada kuruluyor.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component icinden cerez yazilamaz.
            // Middleware oturumu zaten tazeledigi icin burayi yutmak guvenli.
          }
        },
      },
    },
  );
}
