"use client";

import * as React from "react";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h))] flex-col items-center justify-center px-6 py-20 text-center">
      <title>{t.meta.error}</title>
      <h1 className="text-[clamp(32px,6vw,48px)] font-semibold leading-tight tracking-headline">{t.error.title}</h1>
      <p className="mt-3 max-w-md text-[17px] text-muted">{t.error.body}</p>
      <Button size="lg" className="mt-8" onClick={() => retry()}>
        {t.error.retry}
      </Button>
    </div>
  );
}
