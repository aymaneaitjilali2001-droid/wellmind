import type { ReactNode } from 'react';
import AppHeader from '@/components/AppHeader';
import RequireRole from '@/components/RequireRole';

// Toutes les pages /hr/... : réservées au rôle HR_ADMIN, avec le menu RH
export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="EMPLOYEE">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </RequireRole>
  );
}