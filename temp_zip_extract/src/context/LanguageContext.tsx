"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import tr from "../i18n/dictionaries/tr.json";
import en from "../i18n/dictionaries/en.json";

type Language = "tr" | "en";
type Dictionary = typeof tr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries = { tr, en };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");

  // Load language preference from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("moffi_language") as Language;
    if (savedLang && (savedLang === "tr" || savedLang === "en")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("moffi_language", lang);
    // Add language to HTML for SEO and accessibility
    document.documentElement.lang = lang;
  };

  // Translation function with path support (e.g., "auth.login.title")
  const t = (path: string): string => {
    const keys = path.split(".");
    let result: any = dictionaries[language];

    for (const key of keys) {
      if (result[key] === undefined) {
        console.warn(`Translation path not found: ${path}`);
        return path;
      }
      result = result[key];
    }

    return result as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
