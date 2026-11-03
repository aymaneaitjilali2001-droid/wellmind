import type { Dictionary } from '@/lib/home-translations';
 
type NavKey = keyof Pick<Dictionary['nav'], 'features' | 'howItWorks' | 'privacy' | 'faq'>;
 
// Liens vers les sections de la page (même liste pour la navbar et le menu mobile)
export const NAV_LINKS: { href: string; key: NavKey }[] = [
  { href: '#features', key: 'features' },
  { href: '#how-it-works', key: 'howItWorks' },
  { href: '#privacy', key: 'privacy' },
  { href: '#faq', key: 'faq' },
];
 