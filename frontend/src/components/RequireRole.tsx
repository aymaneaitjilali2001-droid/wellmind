'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/Authcontext';
import { homeForRole } from '@/lib/Routes';
import type { Role } from '@/types/Auth';

// ---------------------------------------------------------------
// Affiche la page seulement pour le bon rôle :
// - pas connecté → redirection vers /login
// - mauvais rôle → redirection vers l'accueil de son rôle
// C'est un confort d'affichage : la vraie protection des données reste
// requireAuth + requireRole dans le backend.
// ---------------------------------------------------------------

export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    } else if (status === 'authenticated' && user && user.role !== role) {
      router.replace(homeForRole(user.role));
    }
  }, [status, user, role, router]);

  // Tant que la session n'est pas confirmée pour le bon rôle, rien de la page n'est affiché
  if (status !== 'authenticated' || !user || user.role !== role) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </main>
    );
  }

  return <>{children}</>;
}