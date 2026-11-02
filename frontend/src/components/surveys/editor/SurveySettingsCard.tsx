'use client';

import { EyeOff, UserRound } from 'lucide-react';
import { FormField } from '@/components/FormField';
import { TextareaField } from '@/components/TextareaField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EditorErrors, EditorState } from '@/lib/survey-editor';

const MODES = [
  {
    value: true,
    icon: EyeOff,
    title: 'Anonyme',
    text: 'Les réponses ne sont pas reliées au compte de l’employé. Les résultats s’affichent à partir du seuil de confidentialité.',
  },
  {
    value: false,
    icon: UserRound,
    title: 'Identifié',
    text: 'Les RH peuvent voir qui a répondu quoi. L’employé en est informé avant de répondre.',
  },
];

// Paramètres du sondage : titre, thème, description, période, mode de réponse.
// published = sondage déjà publié : seules la description et la date de fin restent modifiables.
export function SurveySettingsCard({
  state,
  errors,
  published,
  onChange,
}: {
  state: EditorState;
  errors: EditorErrors;
  published: boolean;
  onChange: (patch: Partial<EditorState>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Paramètres</CardTitle>
        <CardDescription>
          {published
            ? 'Ce sondage est publié : seules la description et la date de fin peuvent encore changer.'
            : 'Le titre et la description sont affichés aux employés avant qu’ils répondent.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Titre"
            className="sm:col-span-2"
            placeholder="Ex : Baromètre bien-être — T4 2026"
            value={state.title}
            error={errors.title}
            disabled={published}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <FormField
            label="Thème"
            optional
            placeholder="Ex : Charge de travail"
            value={state.topic}
            error={errors.topic}
            disabled={published}
            onChange={(e) => onChange({ topic: e.target.value })}
          />
        </div>

        <TextareaField
          label="Description"
          optional
          rows={3}
          placeholder="Expliquez l’objectif du sondage et le temps nécessaire pour y répondre."
          value={state.description}
          error={errors.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />

        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Date de début"
              type="date"
              value={state.startDate}
              disabled={published}
              aria-invalid={errors.dates ? true : undefined}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
            <FormField
              label="Date de fin"
              type="date"
              value={state.endDate}
              min={state.startDate || undefined}
              aria-invalid={errors.dates ? true : undefined}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </div>
          {errors.dates ? (
            <p className="text-xs text-destructive">{errors.dates}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Le sondage est ouvert du début de la première journée à la fin de la dernière. Les dates sont
              obligatoires pour publier.
            </p>
          )}
        </div>

        <fieldset disabled={published} className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Mode de réponse</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map(({ value, icon: Icon, title, text }) => (
              <label
                key={title}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
                  'has-[:checked]:border-primary has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                  published && 'cursor-not-allowed opacity-70'
                )}
              >
                <input
                  type="radio"
                  name="anonymity"
                  className="sr-only"
                  checked={state.isAnonymous === value}
                  onChange={() => onChange({ isAnonymous: value })}
                />
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}