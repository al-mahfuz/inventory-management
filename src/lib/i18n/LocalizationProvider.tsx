import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { blocksClient } from "../blocks/client";
import {
  DEFAULT_LANGUAGE,
  baseLanguage,
  interpolate,
  localDictionary,
  nativeLanguageName,
  setActiveLocale
} from "./dictionary";
import type { TranslationKey, TranslationParams } from "./dictionary";
import { LocalizedError } from "./LocalizedError";

type Dictionary = Record<string, string>;
export type LocalizationLanguage = { code: string; isDefault: boolean; name: string };
type LocalizationValue = {
  language: string;
  languages: LocalizationLanguage[];
  setLanguage: (language: string) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  /** Message for a caught error: translated when it is a LocalizedError. */
  errorMessage: (error: unknown) => string;
};

const LocalizationContext = createContext<LocalizationValue | undefined>(undefined);
const LANGUAGE_KEY = "blocks-app:language";
// Cloud modules layered over the bundled dictionaries. Keys in the cloud
// "common" module are the same keys the app uses (see blocks/localization).
const MODULES = ["common"];

// Languages the app ships dictionaries for -- used when the tenant's
// language list is unavailable (offline, not signed in to a tenant yet).
const BUNDLED_LANGUAGES: LocalizationLanguage[] = [
  { code: "en-US", isDefault: true, name: "English" },
  { code: "de-DE", isDefault: false, name: "Deutsch" },
  { code: "bn-BD", isDefault: false, name: "বাংলা" }
];

function normalizeLanguage(raw: Record<string, unknown>): LocalizationLanguage {
  const code = String(raw.languageCode ?? raw.code ?? raw.culture ?? DEFAULT_LANGUAGE);
  const name = nativeLanguageName(code) ?? String(raw.languageName ?? raw.displayName ?? raw.name ?? code);
  return { code, isDefault: Boolean(raw.isDefault), name };
}

function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [languageOverride, setLanguageOverride] = useState(readStoredLanguage);

  const languagesQuery = useQuery({
    queryFn: () => blocksClient.localization.languages(),
    queryKey: ["i18n", "languages"],
    staleTime: 5 * 60_000
  });

  const languages = useMemo(() => {
    const fromTenant = (languagesQuery.data ?? []).map(normalizeLanguage);
    return fromTenant.length > 0 ? fromTenant : BUNDLED_LANGUAGES;
  }, [languagesQuery.data]);

  // English is always the default, whatever the tenant marks as default --
  // use the tenant's English culture code (e.g. en-US) so cloud lookups hit.
  const defaultLanguage = languages.find((entry) => baseLanguage(entry.code) === "en")?.code ?? DEFAULT_LANGUAGE;
  const language = languages.some((entry) => entry.code === languageOverride) ? languageOverride : defaultLanguage;

  // Formatters (numbers, dates) read the active locale outside React.
  setActiveLocale(language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(next: string) {
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this session.
    }
    setLanguageOverride(next);
  }

  // One cached query per module for the active language -- TanStack Query
  // dedupes/caches by queryKey, so switching back never re-fetches a
  // (language, module) pair that's already in cache. A missing module just
  // leaves the bundled dictionary in charge.
  const moduleQueries = useQueries({
    queries: MODULES.map((moduleName) => ({
      queryFn: () => blocksClient.localization.translations(moduleName, language),
      queryKey: ["i18n", "translations", language, moduleName],
      staleTime: 5 * 60_000
    }))
  });

  const cloudDictionary = useMemo<Dictionary>(() => {
    const merged: Dictionary = {};
    for (const query of moduleQueries) Object.assign(merged, query.data ?? {});
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, moduleQueries.map((query) => query.dataUpdatedAt).join()]);

  const value = useMemo<LocalizationValue>(() => {
    const local = localDictionary(language);
    const t = (key: TranslationKey, params?: TranslationParams) =>
      interpolate(cloudDictionary[key] || local[key], params);
    return {
      errorMessage: (error) => (error instanceof LocalizedError ? t(error.key, error.params) : error instanceof Error ? error.message : String(error)),
      language,
      languages,
      setLanguage,
      t
    };
  }, [cloudDictionary, language, languages]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useT() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error("useT must be used within LocalizationProvider");
  return context;
}
