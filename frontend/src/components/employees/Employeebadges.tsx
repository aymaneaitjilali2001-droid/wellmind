import { cn } from '@/lib/utils';
import type { Employee } from '@/types/user';

// Petits éléments visuels partagés par le tableau et la fiche employé

export function EmployeeInitials({ employee, size = 'md' }: { employee: Employee; size?: 'md' | 'lg' }) {
  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'lg' ? 'size-14 text-lg' : 'size-9 text-xs',
        employee.isActive ? 'bg-brand-100 text-brand-700' : 'bg-muted text-muted-foreground'
      )}
    >
      {initials}
    </span>
  );
}

export function RoleBadge({ role }: { role: Employee['role'] }) {
  return role === 'HR_ADMIN' ? (
    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">RH</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Employé</span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', active ? 'bg-brand-500' : 'bg-red-500')} />
      {active ? 'Actif' : 'Désactivé'}
    </span>
  );
}