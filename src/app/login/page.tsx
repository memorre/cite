"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "motion/react";
import { BookOpen, FileText, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const DEMO_ACCOUNT = { email: "demo@cite.app", password: "password123" };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [demoPending, setDemoPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/library");
    router.refresh();
  }

  async function handleDemoLogin() {
    setDemoPending(true);
    setError(null);
    const res = await signIn("credentials", { ...DEMO_ACCOUNT, redirect: false });
    setDemoPending(false);
    if (res?.error) {
      setError("Could not sign in to the demo account.");
      return;
    }
    router.push("/library");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-mesh pointer-events-none absolute inset-0" />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 md:grid-cols-2 md:gap-4">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden flex-col justify-center gap-6 pr-8 md:flex"
        >
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Portfolio build
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Ask your documents. Get answers with receipts.
          </h1>
          <p className="max-w-sm text-sm text-muted">
            Upload a PDF, ask questions in plain language, and get answers grounded in the actual text — with the
            exact passage cited every time.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: FileText, text: "Upload PDFs, chunked and embedded automatically" },
              { icon: Quote, text: "Every answer cites the source page" },
              { icon: BookOpen, text: "Chat streams token-by-token, grounded in your library" },
            ].map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass mx-auto w-full max-w-sm p-7">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted">Sign in to continue to Cite.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" disabled={pending} className="mt-2 w-full">
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="secondary" className="w-full" disabled={demoPending} onClick={handleDemoLogin}>
              <BookOpen className="h-3.5 w-3.5" />
              {demoPending ? "Signing in…" : "Try the demo account"}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">
              demo@cite.app / <code className="text-foreground">password123</code>
            </p>

            <p className="mt-6 text-center text-xs text-muted">
              <Link href="/" className="text-primary hover:underline">
                ← Back to home
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
