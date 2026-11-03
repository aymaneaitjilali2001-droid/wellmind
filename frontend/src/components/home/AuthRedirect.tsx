'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/Authcontext';
import { homeForRole } from '@/lib/Routes';

// N'affiche rien : redirige seulement un utilisateur déjà connecté vers son espace
export function AuthRedirect() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && user) router.replace(homeForRole(user.role));
  }, [status, user, router]);

  return null;
}