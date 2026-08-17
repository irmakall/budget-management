import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      pendingLabel="Logging in..."
      action={signIn}
      passwordAutoComplete="current-password"
    />
  );
}
