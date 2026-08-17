import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <p>{user.email}</p>
      <form action={signOut}>
        <button>Log out</button>
      </form>
    </>
  );
}
