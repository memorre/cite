"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES, LOCALE_LABELS, isLocale } from "@/i18n/config";
import { useI18n, writeLocaleCookie } from "@/i18n/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Globe button that opens the language list. Same behaviour as on yetao.org and Snip. */
export function LanguageMenu() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function choose(value: string) {
    if (!isLocale(value) || value === locale) return;
    writeLocaleCookie(value);
    document.documentElement.lang = value;
    // Re-render the Server Components in the new language without a full reload.
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.nav.language}
          title={t.nav.language}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring data-[state=open]:bg-fill",
            pending && "opacity-60"
          )}
        >
          <Globe className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuLabel>{t.nav.language}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={choose}>
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {LOCALE_LABELS[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
