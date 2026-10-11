import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import zhCN from "./zh-CN";
import fr from "./fr";
import es from "./es";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = {
  "zh-CN": zhCN,
  en,
  fr,
  es,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}
