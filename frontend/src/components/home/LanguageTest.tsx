'use client';

import { LanguageSwitch } from './LanguageSwitch';
import { useLanguage } from './LanguageProvider';

// Provisoire : sera supprimé à l'étape 2
export function LanguageTest() {
  const { t, lang } = useLanguage();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <LanguageSwitch />
      <p>Langue actuelle : {lang}</p>
      <ul className="list-disc pl-5">
        <li>{t.nav.features}</li>
        <li>{t.nav.howItWorks}</li>
        <li>{t.nav.privacy}</li>
        <li>{t.nav.login}</li>
        <li>{t.nav.start}</li>
      </ul>
    </main>
  );
}