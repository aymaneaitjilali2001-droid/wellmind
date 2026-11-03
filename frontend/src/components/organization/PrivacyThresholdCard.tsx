'use client';

import { useState, type FormEvent } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaveAction } from '@/hooks/useSaveAction';
import type { UpdateOrganizationInput } from '@/services/organization';
import type { Organization } from '@/types/Auth';
import { SaveFooter } from './SaveFooter';

// Limites du modèle Organization (minResponseThreshold : min 3, max 50, défaut 5)
const MIN = 3;
const MAX = 50;
const RECOMMENDED = 5;

// Seuil minimal de réponses avant d'afficher les résultats détaillés et l'analyse IA
export function PrivacyThresholdCard({
  organization,
  onSave,
}: {
  organization: Organization;
  onSave: (input: UpdateOrganizationInput) => Promise<Organization>;
}) {
  const [initial, setInitial] = useState(organization.minResponseThreshold);
  // Texte saisi : on ne force pas la valeur pendant la frappe (taper « 10 » passe par « 1 »)
  const [text, setText] = useState(String(organization.minResponseThreshold));
  const { run, saving, saved, error, details } = useSaveAction();

  const parsed = Number(text);
  const valid = /^\d+$/.test(text) && parsed >= MIN && parsed <= MAX;
  // Valeur utilisée par le curseur et les messages
  const value = valid ? parsed : initial;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return; // l'erreur est déjà affichée sous le champ
    await run(async () => {
      const updated = await onSave({ minResponseThreshold: parsed });
      setInitial(updated.minResponseThreshold);
      setText(String(updated.minResponseThreshold));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Seuil de confidentialité</CardTitle>
        <CardDescription>
          Les résultats détaillés d’un sondage et l’analyse IA ne s’affichent qu’à partir de ce nombre de
          réponses. Un seuil plus élevé protège mieux l’anonymat des répondants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label htmlFor="threshold" className="text-sm font-medium">
              Nombre minimal de réponses
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={1}
                value={value}
                onChange={(e) => setText(e.target.value)}
                aria-label="Nombre minimal de réponses (curseur)"
                className="h-2 flex-1 cursor-pointer accent-brand-600"
              />
              <input
                id="threshold"
                type="number"
                min={MIN}
                max={MAX}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-invalid={valid ? undefined : true}
                aria-describedby="threshold-help"
                className="h-9 w-20 aria-invalid:border-destructive rounded-md border border-input bg-background px-3 text-center text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <p id="threshold-help" className={valid ? 'text-xs text-muted-foreground' : 'text-xs text-destructive'}>
              {valid ? `Entre ${MIN} et ${MAX}. Valeur recommandée : ${RECOMMENDED}.` : `Saisissez un nombre entier entre ${MIN} et ${MAX}.`}
            </p>
          </div>

          {value < RECOMMENDED ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Avec si peu de réponses, il devient plus facile de deviner qui a répondu quoi, surtout dans les
              petites équipes.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Un sondage devra recevoir au moins {value} réponses avant que ses résultats détaillés soient visibles.
            </p>
          )}

          <SaveFooter
            dirty={text !== String(initial)}
            saving={saving}
            saved={saved}
            error={error}
            details={details}
            onReset={() => setText(String(initial))}
          />
        </form>
      </CardContent>
    </Card>
  );
}