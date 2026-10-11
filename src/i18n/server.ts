// Server-side locale resolution. Only import this from Server Components, generateMetadata,
// Server Functions or Route Handlers: it reads the request's cookies and headers.
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import { createI18n, type I18n } from "./format";

/** "lang" cookie if valid → best Accept-Language match → "en". */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}

export async function getI18n(): Promise<I18n> {
  const locale = await getLocale();
  return createI18n(locale, getDictionary(locale));
}
