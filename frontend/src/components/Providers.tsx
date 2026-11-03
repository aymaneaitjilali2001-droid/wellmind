'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { AuthProvider } from '../context/Authcontext';
import { swrConfig } from '../lib/Swr';

// Fournisseurs globaux : configuration SWR, puis session utilisateur
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}