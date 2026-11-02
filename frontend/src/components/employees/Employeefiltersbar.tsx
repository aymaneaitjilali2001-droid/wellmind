'use client';

import { Search, X } from 'lucide-react';
import { NativeSelect } from '@/components/Nativeselect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Role } from '@/types/Auth';

export interface FiltersValue {
  search: string;
  role: Role | '';
  isActive: 'true' | 'false' | '';
  department: string;
}

// Barre de recherche et de filtres de la liste des employés
export function EmployeeFiltersBar({
  value,
  departments,
  onChange,
  onReset,
}: {
  value: FiltersValue;
  departments: string[];
  onChange: (next: Partial<FiltersValue>) => void;
  onReset: () => void;
}) {
  const hasFilters = Boolean(value.search || value.role || value.isActive || value.department);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Rechercher un employé"
          placeholder="Rechercher par nom ou e-mail"
          className="pl-9"
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
        <NativeSelect
          aria-label="Filtrer par rôle"
          value={value.role}
          onChange={(e) => onChange({ role: e.target.value as Role | '' })}
          className="lg:w-40"
        >
          <option value="">Tous les rôles</option>
          <option value="EMPLOYEE">Employés</option>
          <option value="HR_ADMIN">RH</option>
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrer par statut"
          value={value.isActive}
          onChange={(e) => onChange({ isActive: e.target.value as FiltersValue['isActive'] })}
          className="lg:w-40"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrer par service"
          value={value.department}
          onChange={(e) => onChange({ department: e.target.value })}
          disabled={departments.length === 0}
          className="col-span-2 sm:col-span-1 lg:w-44"
        >
          <option value="">Tous les services</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </NativeSelect>
      </div>

      {hasFilters && (
        <Button variant="ghost" onClick={onReset} className="self-start lg:self-auto">
          <X aria-hidden="true" /> Effacer
        </Button>
      )}
    </div>
  );
}