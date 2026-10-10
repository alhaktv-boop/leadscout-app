// src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNotice("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find the Reddit threads where people are already asking for what you sell.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input type="email" required placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Input type="password" required minLength={8} placeholder="Password (8+ characters)" value={password}
               onChange={(e) => setPassword(e.target.value)}
               autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground">
            By creating an account you agree to the{" "}
            <Link href="/terms" className="underline">Terms of Service</Link> and the{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <button type="button" className="text-left text-sm text-muted-foreground underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
