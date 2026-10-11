"use client";

import * as React from "react";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";
import { createI18n, type I18n } from "./format";

const I18nContext = React.createContext<I18n | null>(null);

/** Fed from the root layout with the locale resolved on the server, so the first paint is already translated. */
export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => createI18n(locale, dictionary), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/**
 * Persists the choice in the "lang" cookie. On yetao.org and its subdomains the cookie is
 * written for the parent domain, so the homepage and the other apps share the same choice.
 */
export function writeLocaleCookie(locale: Locale) {
  const host = window.location.hostname;
  const shared = host === "yetao.org" || host.endsWith(".yetao.org");
  const base = `Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  if (shared) {
    // Drop any host-only copy first so it can't shadow the shared one.
    document.cookie = `${LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${LOCALE_COOKIE}=${locale}; ${base}; Domain=yetao.org`;
  } else {
    document.cookie = `${LOCALE_COOKIE}=${locale}; ${base}`;
  }
}
