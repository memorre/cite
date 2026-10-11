import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getI18n } from "@/i18n/server";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // The root layout's title template doesn't reach its own segment's not-found page, so add the suffix here.
  return { title: { absolute: `${t.meta.notFound} · Cite` } };
}

export default async function NotFound() {
  const [{ t }, session] = await Promise.all([getI18n(), auth()]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h))] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[17px] font-semibold tabular-nums text-muted">404</p>
      <h1 className="mt-2 text-[clamp(32px,6vw,48px)] font-semibold leading-tight tracking-headline">
        {t.notFound.title}
      </h1>
      <p className="mt-3 max-w-md text-[17px] text-muted">{t.notFound.body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Button size="lg" asChild>
          <Link href="/">{t.common.backHome}</Link>
        </Button>
        {session?.user && (
          <Link href="/library" className="link-more text-[17px]">
            {t.notFound.library}
          </Link>
        )}
      </div>
    </div>
  );
}
