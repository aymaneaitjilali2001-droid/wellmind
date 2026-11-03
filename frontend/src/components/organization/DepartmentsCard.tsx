'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Info, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSaveAction } from '@/hooks/useSaveAction';
import type { UpdateOrganizationInput } from '@/services/organization';
import type { Organization } from '@/types/Auth';
import { SaveFooter } from './SaveFooter';

const MAX_LENGTH = 80;

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item, i) => item === b[i]);

// Liste des services de l'organisation (proposée dans le formulaire des employés et les filtres)
export function DepartmentsCard({
  organization,
  onSave,
}: {
  organization: Organization;
  onSave: (input: UpdateOrganizationInput) => Promise<Organization>;
}) {
  const [initial, setInitial] = useState<string[]>(organization.departments);
  const [departments, setDepartments] = useState<string[]>(organization.departments);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const { run, saving, saved, error, details } = useSaveAction();

  const dirty = !sameList(departments, initial);

  const add = () => {
    const name = newName.trim();
    if (!name) {
      setAddError('Saisissez un nom de service.');
      return;
    }
    if (name.length > MAX_LENGTH) {
      setAddError(`${MAX_LENGTH} caractères maximum.`);
      return;
    }
    // Pas de doublon, même avec d'autres majuscules (« RH » et « rh »)
    if (departments.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setAddError('Ce service existe déjà.');
      return;
    }
    setDepartments((prev) => [...prev, name]);
    setNewName('');
    setAddError(null);
  };

  // Entrée dans le champ ajoute le service (au lieu d'enregistrer toute la carte)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  const remove = (name: string) => setDepartments((prev) => prev.filter((d) => d !== name));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await run(async () => {
      const updated = await onSave({ departments });
      setInitial(updated.departments);
      setDepartments(updated.departments);
    });
  };

  const removedCount = initial.filter((d) => !departments.includes(d)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Services</CardTitle>
        <CardDescription>
          Proposés dans le formulaire des employés et dans les filtres. Une liste commune évite d’avoir « RH »,
          « rh » et « Ressources humaines » pour le même service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Services actuels */}
          {departments.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Services de l'organisation">
              {departments.map((name) => (
                <li
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-sm"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => remove(name)}
                    aria-label={`Retirer le service ${name}`}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun service pour l’instant. Le service des employés est alors saisi librement.
            </p>
          )}

          {/* Ajout d'un service */}
          <div className="flex flex-col gap-2">
            <label htmlFor="new-department" className="text-sm font-medium">
              Ajouter un service
            </label>
            <div className="flex gap-2">
              <Input
                id="new-department"
                placeholder="Ex : Informatique"
                value={newName}
                maxLength={MAX_LENGTH}
                aria-invalid={addError ? true : undefined}
                aria-describedby={addError ? 'new-department-error' : undefined}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setAddError(null);
                }}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="outline" onClick={add}>
                <Plus aria-hidden="true" /> Ajouter
              </Button>
            </div>
            {addError && (
              <p id="new-department-error" className="text-xs text-destructive">
                {addError}
              </p>
            )}
          </div>

          {removedCount > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Retirer un service ne modifie pas les employés qui y sont déjà rattachés : leur service actuel est
              conservé.
            </p>
          )}

          <SaveFooter
            dirty={dirty}
            saving={saving}
            saved={saved}
            error={error}
            details={details}
            onReset={() => {
              setDepartments(initial);
              setNewName('');
              setAddError(null);
            }}
          />
        </form>
      </CardContent>
    </Card>
  );
}