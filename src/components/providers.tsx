"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Providers({
  children,
  locale,
  dictionary,
  session,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
  session: Session | null;
}) {
  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
          <Toaster
            position="top-center"
            offset={64}
            containerAriaLabel={dictionary.common.notifications}
            toastOptions={{
              className: "frosted-popover",
              style: {
                background: "var(--popover)",
                color: "var(--foreground)",
                border: "1px solid var(--popover-line)",
                borderRadius: "14px",
                boxShadow: "var(--popover-shadow)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                letterSpacing: "var(--body-tracking)",
              },
            }}
          />
        </ThemeProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
