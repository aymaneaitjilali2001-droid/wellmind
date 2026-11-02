'use client';

'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, SearchX, UserPlus, Users } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { EmployeeFiltersBar, type FiltersValue } from '@/components/employees/Employeefiltersbar';
import { EmployeesTable } from '@/components/employees/Employeestable';
import { Pagination } from '@/components/Pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Authcontext';
import { useDebouncedValue } from '@/hooks/Usedebouncedvalue';
import { useEmployees, useOrganization } from '@/hooks/useEmployees';
import { getErrorMessage } from '@/lib/Api';

const PAGE_SIZE = 10;
const NO_FILTERS: FiltersValue = { search: '', role: '', isActive: '', department: '' };

export default function EmployeesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FiltersValue>(NO_FILTERS);
  const [page, setPage] = useState(1);

  // La recherche n'interroge l'API que 300 ms après la dernière frappe
  const search = useDebouncedValue(filters.search.trim(), 300);

  const { data, error, isLoading, isValidating, mutate } = useEmployees({
    ...filters,
    search,
    page,
    limit: PAGE_SIZE,
  });
  const { data: organization } = useOrganization();

  const hasFilters = Boolean(search || filters.role || filters.isActive || filters.department);

  // Un filtre qui change ramène toujours à la page 1
  const changeFilters = (next: Partial<FiltersValue>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(NO_FILTERS);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employés</h1>
          <p className="mt-1 text-muted-foreground">
            Gérez les comptes de votre organisation.
            {data && (
              <>
                {' '}
                {data.total} {data.total > 1 ? 'comptes' : 'compte'}
                {hasFilters && ' correspondant à la recherche'}.
              </>
            )}
          </p>
        </div>
        <ButtonLink href="/hr/employees/new">
          <UserPlus aria-hidden="true" /> Ajouter un employé
        </ButtonLink>
      </div>

      <EmployeeFiltersBar
        value={filters}
        departments={organization?.departments ?? []}
        onChange={changeFilters}
        onReset={resetFilters}
      />

      {/* Premier chargement */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des employés" />
        </div>
      )}

      {/* Erreur */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger les employés</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Données */}
      {data && !error && (
        <>
          {data.items.length > 0 ? (
            <div className="relative">
              {/* Indicateur discret pendant le rechargement (nouvelle recherche, page suivante) */}
              {isValidating && (
                <Loader2
                  className="absolute -top-8 right-0 size-4 animate-spin text-muted-foreground"
                  aria-label="Mise à jour"
                />
              )}
              <EmployeesTable employees={data.items} currentUserId={user?._id} />
            </div>
          ) : hasFilters ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucun employé ne correspond à votre recherche</p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <Users aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucun employé pour l’instant</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ajoutez les comptes de vos employés pour qu’ils puissent répondre aux sondages.
              </p>
              <ButtonLink href="/hr/employees/new" className="mt-2">
                <UserPlus aria-hidden="true" /> Ajouter un employé
              </ButtonLink>
            </div>
          )}

          <Pagination page={page} limit={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      )}
    </div>
  );
}