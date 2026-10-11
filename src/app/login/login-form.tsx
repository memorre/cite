"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useI18n } from "@/i18n/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginErrorKey, type LoginErrorKey } from "./errors";

const DEMO_ACCOUNT = { email: "demo@cite.app", password: "password123" };

export function LoginForm({ initialError = null }: { initialError?: LoginErrorKey | null }) {
  const router = useRouter();
  const { t, f } = useI18n();
  // A key, not the translated text, so a visible error follows a language switch.
  const [error, setError] = React.useState<LoginErrorKey | null>(initialError);
  const [pending, setPending] = React.useState(false);
  const [demoPending, setDemoPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (res?.error) {
        setError(loginErrorKey(res.error));
        return;
      }
      router.push("/library");
      router.refresh();
    } catch {
      setError("errorGeneric");
    } finally {
      setPending(false);
    }
  }

  async function handleDemoLogin() {
    setDemoPending(true);
    setError(null);
    try {
      const res = await signIn("credentials", { ...DEMO_ACCOUNT, redirect: false });
      if (res?.error) {
        setError("errorDemo");
        return;
      }
      router.push("/library");
      router.refresh();
    } catch {
      setError("errorDemo");
    } finally {
      setDemoPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h))] justify-center bg-background-alt px-4 py-12 sm:items-center sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="rise mb-8 flex flex-col items-center text-center">
          <AppIcon size={64} />
          <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-headline">{t.login.title}</h1>
          <p className="mt-2 text-[17px] text-muted text-balance">{t.login.subtitle}</p>
        </div>

        <Card className="rise p-6 sm:p-8" style={{ "--i": 1 } as React.CSSProperties}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t.login.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.login.emailPlaceholder}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t.login.password}</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>

            {error && (
              <p role="alert" className="rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-text">
                {t.login[error]}
              </p>
            )}

            <Button type="submit" size="lg" disabled={pending || demoPending} className="mt-2 w-full">
              {pending ? t.login.submitting : t.login.submit}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
            <div className="h-px flex-1 bg-separator" />
            {t.login.or}
            <div className="h-px flex-1 bg-separator" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={pending || demoPending}
            onClick={handleDemoLogin}
          >
            {demoPending ? t.login.submitting : t.login.demo}
          </Button>
          <p className="mt-3 text-center text-[12px] text-muted">
            {f(t.login.demoHint, { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password })}
          </p>
        </Card>

        <p className="mt-6 text-center text-[15px]">
          <Link href="/" className="text-link hover:underline">
            {t.common.backHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
