import { createBrowserClient } from "@supabase/ssr";

// Tarayicida calisan Supabase istemcisi.
// "use client" bileşenlerinde bunu kullaniyoruz.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
