// Locale configuration shared by the server, the client and route handlers.
// Keep this file free of server-only or client-only imports.

export const LOCALES = ["zh-CN", "en", "fr", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie shared with yetao.org and its other subdomains. */
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Menu labels, always written in their own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  en: "English",
  fr: "Français",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Maps a single language tag (e.g. "zh-Hant-TW", "fr-CA", "en") to a supported locale. */
export function localeFromTag(tag: string): Locale | null {
  const t = tag.trim().toLowerCase();
  if (t.startsWith("zh")) return "zh-CN";
  if (t.startsWith("fr")) return "fr";
  if (t.startsWith("es")) return "es";
  if (t.startsWith("en")) return "en";
  return null;
}

/** Picks the best supported locale from an Accept-Language header value, honouring q-weights. */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag, weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  for (const entry of ranked) {
    const locale = localeFromTag(entry.tag);
    if (locale) return locale;
  }
  return null;
}

/** Resolution order: valid "lang" cookie → Accept-Language → default. */
export function resolveLocale(cookieValue: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return matchAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
