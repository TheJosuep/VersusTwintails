"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_OPTIONS,
  TRANSLATIONS,
  type Locale,
  type Translations,
} from "@/lib/i18n";

const STORAGE_LOCALE_KEY = "vt_locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    let resolved: Locale = "es";
    try {
      const saved = localStorage.getItem(STORAGE_LOCALE_KEY);
      if (saved === "es" || saved === "en" || saved === "ja") {
        resolved = saved;
      } else if (typeof navigator !== "undefined") {
        const lang = navigator.language.toLowerCase();
        if (lang.startsWith("ja")) resolved = "ja";
        else if (lang.startsWith("en")) resolved = "en";
      }
    } catch {
      // Ignore storage read error
    }
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_LOCALE_KEY, next);
    } catch {
      // Ignore storage write error
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: TRANSLATIONS[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return ctx;
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.05] p-0.5 backdrop-blur-md"
    >
      {LOCALE_OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code)}
            aria-pressed={active}
            className={`whitespace-nowrap shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              active
                ? "bg-white text-black"
                : "text-white/65 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
