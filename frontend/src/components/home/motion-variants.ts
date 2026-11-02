import type { Variants } from 'motion/react';

// Animations communes de la landing page, pour garder les mêmes durées partout

// Apparition : fondu + léger glissement vers le haut
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Conteneur : ses enfants apparaissent les uns après les autres
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// Déclenchement au défilement : une seule fois, quand 20 % de l'élément est visible
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.2 },
} as const;