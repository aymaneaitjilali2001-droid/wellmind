'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Authcontext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Menu de chaque espace (les pages seront créées au fur et à mesure)
const HR_NAV: NavItem[] = [
  { href: '/hr', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/hr/surveys', label: 'Sondages', icon: ClipboardList },
  { href: '/hr/employees', label: 'Employés', icon: Users },
  { href: '/hr/actions', label: 'Actions', icon: ListChecks },
  { href: '/hr/organization', label: 'Organisation', icon: Building2 },
];

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/employee', label: 'Mes sondages', icon: ClipboardList },
  { href: '/employee/history', label: 'Historique', icon: History },
  { href: '/employee/actions', label: 'Actions', icon: ListChecks },
];

export default function AppHeader() {
  const { user, organization, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const items = user.role === 'HR_ADMIN' ? HR_NAV : EMPLOYEE_NAV;
  const home = items[0].href;

  // Lien actif : la page exacte pour l'accueil, la page ou ses sous-pages pour les autres
  const isActive = (href: string) => (href === home ? pathname === href : pathname.startsWith(href));

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        {/* Logo et organisation */}
        <Link href={home} className="flex shrink-0 flex-col leading-tight">
          <span className="text-lg font-bold text-brand-600">WellMind</span>
          {organization && <span className="text-xs text-muted-foreground">{organization.name}</span>}
        </Link>

        {/* Navigation : icônes seules sur petit écran, icône + texte à partir de md */}
        <nav aria-label="Navigation principale" className="flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-brand-100 font-semibold text-brand-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="sr-only md:not-sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utilisateur et déconnexion */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right leading-tight lg:block">
            <p className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user.role === 'HR_ADMIN' ? 'Ressources humaines' : 'Employé'}</p>
          </div>
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          >
            {initials}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} disabled={loggingOut} aria-label="Se déconnecter">
            {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          </Button>
        </div>
      </div>
    </header>
  );
}