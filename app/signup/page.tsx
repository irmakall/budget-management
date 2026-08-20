import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <AuthForm
      title="Create account"
      submitLabel="Create account"
      pendingLabel="Creating…"
      action={signUp}
      passwordAutoComplete="new-password"
      altPrompt="Already have an account?"
      altHref="/login"
      altLabel="Log in"
    />
  );
}
