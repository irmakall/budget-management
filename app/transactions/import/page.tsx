import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      current="/transactions"
      title="Import CSV"
      meta="Bring transactions in from a bank export or another tracker"
      actions={
        <Link href="/transactions" className="btn btn-secondary btn-sm">
          ← Transactions
        </Link>
      }
    >
      <ImportWizard />
    </AppShell>
  );
}
