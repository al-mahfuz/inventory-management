// Bundled dictionaries. The JSON files under blocks/localization are the single
// source: the app imports them for first paint / offline use, and the same
// files are pushed to the Blocks Localization "common" module, whose values
// override these at runtime.
import bn from "../../../blocks/localization/common.bn-BD.json";
import de from "../../../blocks/localization/common.de-DE.json";
import en from "../../../blocks/localization/common.en-US.json";

export const DEFAULT_LANGUAGE = "en-US";

export const defaultDictionary = en;
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;

// Typed against the English keys, so a key missing from a translation fails
// the type check instead of silently showing English.
const german: Record<TranslationKey, string> = de;
const bengali: Record<TranslationKey, string> = bn;

const dictionaries: Record<string, Record<TranslationKey, string>> = { bn: bengali, de: german, en };

const NATIVE_NAMES: Record<string, string> = { bn: "বাংলা", de: "Deutsch", en: "English" };

/** "de-DE" -> "de". */
export function baseLanguage(code: string): string {
  return code.split(/[-_]/)[0]?.toLowerCase() ?? "";
}

export function nativeLanguageName(code: string): string | undefined {
  return NATIVE_NAMES[baseLanguage(code)];
}

/** Bundled dictionary for a language, English keys filling any gaps. */
export function localDictionary(code: string): Record<TranslationKey, string> {
  const match = dictionaries[baseLanguage(code)];
  return match && match !== en ? { ...en, ...match } : en;
}

/** Replaces {name} placeholders with params.name. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

let activeLocale = DEFAULT_LANGUAGE;

/** Locale for number/date formatting; kept in step with the UI language. */
export function getActiveLocale(): string {
  return activeLocale;
}

export function setActiveLocale(code: string) {
  activeLocale = code;
}
