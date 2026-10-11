import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { LoginForm } from "./login-form";
import { loginErrorKey } from "./errors";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.login };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [session, { error }] = await Promise.all([auth(), searchParams]);
  if (session?.user) redirect("/library");
  // Auth.js sends its errors here (pages.error) as ?error=<type>.
  const authError = Array.isArray(error) ? error[0] : error;
  return <LoginForm initialError={authError ? loginErrorKey(authError) : null} />;
}
