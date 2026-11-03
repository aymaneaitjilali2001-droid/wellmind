'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

// reducedMotion="user" : si le visiteur a activé « Réduire les animations »
// dans son système, motion désactive les déplacements (les fondus restent).
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}