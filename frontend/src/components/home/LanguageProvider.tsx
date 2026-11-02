'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Dictionary, type Lang } from '@/lib/home-translations';

const STORAGE_KEY = 'wellmind-lang';

interface LanguageContextValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Français par défaut, identique côté serveur et côté navigateur
  const [lang, setLangState] = useState<Lang>('fr');

  // Au chargement : reprendre la langue choisie lors d'une visite précédente
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'fr' || saved === 'en') setLangState(saved);
    } catch {
      // Stockage indisponible (navigation privée) : on garde le français
    }
  }, []);

  // Garder l'attribut lang de la page à jour (lecteurs d'écran, traduction du navigateur)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Le choix ne sera simplement pas mémorisé
    }
  }, []);

  const value = useMemo(() => ({ lang, t: dictionaries[lang], setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit être utilisé à l’intérieur de <LanguageProvider>');
  return ctx;
}