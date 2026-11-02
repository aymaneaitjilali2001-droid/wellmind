import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Employee } from '@/types/user';
import { EmployeeInitials, RoleBadge, StatusBadge } from './Employeebadges';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Tableau des employés. Sur petit écran, le rôle, le service et la date sont masqués.
export function EmployeesTable({ employees, currentUserId }: { employees: Employee[]; currentUserId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Liste des employés de l’organisation</caption>
        <thead className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              Employé
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Rôle
            </th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">
              Service
            </th>
            <th scope="col" className="px-4 py-3">
              Statut
            </th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">
              Ajouté le
            </th>
            <th scope="col" className="w-10 px-4 py-3">
              <span className="sr-only">Détail</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {employees.map((employee) => (
            // Toute la ligne est cliquable : le lien du nom s'étend sur la ligne entière
            // grâce à son pseudo-élément ::after (« lien étiré »). Il reste un seul vrai lien
            // par ligne : Tab pour l'atteindre, Entrée pour l'ouvrir, Ctrl + clic pour un nouvel onglet.
            <tr
              key={employee._id}
              className="group relative cursor-pointer transition-colors hover:bg-muted/40 has-[a:focus-visible]:bg-muted/60"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <EmployeeInitials employee={employee} />
                  <div className="min-w-0">
                    <Link
                      href={`/hr/employees/${employee._id}`}
                      className="font-medium text-foreground group-hover:text-primary focus-visible:underline focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                    >
                      {employee.firstName} {employee.lastName}
                    </Link>
                    {employee._id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">(vous)</span>
                    )}
                    <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <RoleBadge role={employee.role} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {employee.department ?? '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge active={employee.isActive} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {dateFormat.format(new Date(employee.createdAt))}
              </td>
              <td className="px-4 py-3">
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}