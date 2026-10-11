// Pure formatting helpers used on both the server and the client.
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

/** Plural forms keyed by Intl.PluralRules categories; `other` is always required. */
export type Plural = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/** Declares a plural entry in a dictionary. */
export function plural(forms: Plural): Plural {
  return forms;
}

export type Vars = Record<string, string | number>;

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();
function pluralRules(locale: Locale) {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

const numberFormatCache = new Map<Locale, Intl.NumberFormat>();
export function formatNumber(locale: Locale, value: number) {
  let fmt = numberFormatCache.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale);
    numberFormatCache.set(locale, fmt);
  }
  return fmt.format(value);
}

/** Replaces {name} placeholders. Numbers are formatted for the locale. */
export function interpolate(locale: Locale, template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    if (value === undefined) return match;
    return typeof value === "number" ? formatNumber(locale, value) : value;
  });
}

/** Picks the right plural form for `count` and fills in {count} plus any other vars. */
export function formatPlural(locale: Locale, forms: Plural, count: number, vars?: Vars) {
  const category = pluralRules(locale).select(count) as keyof Plural;
  const template = forms[category] ?? forms.other;
  return interpolate(locale, template, { count, ...vars });
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * "3 minutes ago" / "il y a 3 minutes" / "hace 3 minutos" / "3天前", or `justNow` for anything
 * under 45 seconds (Intl's own "now" reads badly inside sentences such as "Uploaded now").
 */
export function formatRelativeTime(
  locale: Locale,
  date: Date | string | number,
  justNow: string,
  now: number = Date.now()
) {
  const target = new Date(date).getTime();
  let duration = (target - now) / 1000;
  if (Math.abs(duration) < 45) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "year");
}

export function formatDate(locale: Locale, date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "medium" }).format(new Date(date));
}

export type I18n = {
  locale: Locale;
  /** The full dictionary for the active locale. */
  t: Dictionary;
  /** Interpolates a template string from the dictionary. */
  f: (template: string, vars?: Vars) => string;
  /** Formats a plural entry for `count`. */
  p: (forms: Plural, count: number, vars?: Vars) => string;
  number: (value: number) => string;
  relative: (date: Date | string | number) => string;
  date: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
};

export function createI18n(locale: Locale, dictionary: Dictionary): I18n {
  return {
    locale,
    t: dictionary,
    f: (template, vars) => interpolate(locale, template, vars),
    p: (forms, count, vars) => formatPlural(locale, forms, count, vars),
    number: (value) => formatNumber(locale, value),
    relative: (date) => formatRelativeTime(locale, date, dictionary.common.justNow),
    date: (date, options) => formatDate(locale, date, options),
  };
}
