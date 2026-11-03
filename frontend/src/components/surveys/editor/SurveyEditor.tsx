'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, AlignLeft, Check, ListChecks, Loader2, Plus, SlidersHorizontal } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSaveAction } from '@/hooks/useSaveAction';
import {
  countErrors,
  emptyEditorState,
  LIMITS,
  newKey,
  newQuestion,
  surveyToEditorState,
  toFullInput,
  toPublishedInput,
  validateEditor,
  type DraftQuestion,
  type EditorState,
} from '@/lib/survey-editor';
import { createSurvey, updateSurvey } from '@/services/surveys';
import type { QuestionType, Survey, SurveyInput } from '@/types/survey';
import { QuestionCard } from './QuestionCard';
import { SurveySettingsCard } from './SurveySettingsCard';

const ADD_BUTTONS: { type: QuestionType; label: string; icon: typeof SlidersHorizontal }[] = [
  { type: 'RATING', label: 'Échelle', icon: SlidersHorizontal },
  { type: 'CHOICE', label: 'Choix unique', icon: ListChecks },
  { type: 'TEXT', label: 'Réponse libre', icon: AlignLeft },
];

// ---------------------------------------------------------------
// Éditeur de sondage.
// - sans `survey` : création d'un brouillon
// - brouillon : tout est modifiable
// - publié : seules la description et la date de fin (règle du backend)
// Les sondages clôturés ne sont pas modifiables (la page ne l'affiche pas).
// ---------------------------------------------------------------
export function SurveyEditor({
  survey,
  cancelHref,
  onSaved,
}: {
  survey?: Survey;
  cancelHref: string;
  onSaved: (saved: Survey) => Promise<void> | void;
}) {
  const published = survey?.status === 'PUBLISHED';
  const [state, setState] = useState<EditorState>(() => (survey ? surveyToEditorState(survey) : emptyEditorState()));

  const toInput = (s: EditorState): SurveyInput => (published ? toPublishedInput(s) : toFullInput(s));

  // « Instantané » de la dernière version enregistrée, pour savoir s'il y a des modifications
  const [savedSnapshot, setSavedSnapshot] = useState(() => (survey ? JSON.stringify(toInput(state)) : ''));
  const dirty = JSON.stringify(toInput(state)) !== savedSnapshot;

  // Les erreurs ne s'affichent qu'après une première tentative d'enregistrement
  const [showErrors, setShowErrors] = useState(false);
  const errors = useMemo(() => validateEditor(state, published ? 'published' : 'draft'), [state, published]);
  const visibleErrors = showErrors ? errors : { byQuestion: {} };
  const errorCount = countErrors(errors);

  const { run, saving, saved, error, details } = useSaveAction();

  // Avertit avant de quitter la page (fermeture de l'onglet, rechargement) avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = (next: Partial<EditorState>) => setState((prev) => ({ ...prev, ...next }));

  // ---------- Opérations sur les questions ----------
  const setQuestions = (update: (questions: DraftQuestion[]) => DraftQuestion[]) =>
    setState((prev) => ({ ...prev, questions: update(prev.questions) }));

  const addQuestion = (type: QuestionType) => setQuestions((qs) => [...qs, newQuestion(type)]);

  const updateQuestion = (next: DraftQuestion) =>
    setQuestions((qs) => qs.map((q) => (q.key === next.key ? next : q)));

  const moveQuestion = (key: string, direction: -1 | 1) =>
    setQuestions((qs) => {
      const from = qs.findIndex((q) => q.key === key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= qs.length) return qs;
      const copy = [...qs];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });

  const duplicateQuestion = (key: string) =>
    setQuestions((qs) => {
      const index = qs.findIndex((q) => q.key === key);
      if (index < 0) return qs;
      const original = qs[index];
      const copy: DraftQuestion = {
        ...original,
        key: newKey(),
        options: original.options.map((o) => ({ key: newKey(), label: o.label })),
      };
      return [...qs.slice(0, index + 1), copy, ...qs.slice(index + 1)];
    });

  const removeQuestion = (key: string) => setQuestions((qs) => qs.filter((q) => q.key !== key));

  // ---------- Enregistrement ----------
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (errorCount > 0) return;

    const input = toInput(state);
    await run(async () => {
      const result = survey ? await updateSurvey(survey._id, input) : await createSurvey(input);
      setSavedSnapshot(JSON.stringify(input));
      setShowErrors(false);
      await onSaved(result);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <SurveySettingsCard state={state} errors={visibleErrors} published={published} onChange={patch} />

      {/* Questions */}
      <section aria-labelledby="questions-title" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="questions-title" className="text-lg font-semibold">
              Questions <span className="text-muted-foreground">({state.questions.length})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {published
                ? 'Les questions ne peuvent plus changer : cela fausserait les réponses déjà reçues.'
                : 'Elles s’afficheront dans cet ordre. Au moins une question est nécessaire pour publier.'}
            </p>
          </div>
        </div>

        {state.questions.length === 0 && (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Aucune question. Ajoutez-en une ci-dessous.
          </p>
        )}

        {state.questions.map((question, index) => (
          <QuestionCard
            key={question.key}
            question={question}
            index={index}
            total={state.questions.length}
            errors={visibleErrors.byQuestion[question.key]}
            readOnly={published}
            onChange={updateQuestion}
            onMove={(direction) => moveQuestion(question.key, direction)}
            onDuplicate={() => duplicateQuestion(question.key)}
            onRemove={() => removeQuestion(question.key)}
          />
        ))}

        {visibleErrors.questions && <p className="text-sm text-destructive">{visibleErrors.questions}</p>}

        {!published && (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm font-medium sm:mr-auto">
              <Plus aria-hidden="true" className="size-4" /> Ajouter une question
            </p>
            {ADD_BUTTONS.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addQuestion(type)}
                disabled={state.questions.length >= LIMITS.questions}
              >
                <Icon aria-hidden="true" /> {label}
              </Button>
            ))}
          </div>
        )}
      </section>

      {/* Barre d'enregistrement, toujours visible en bas de l'écran */}
      <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur">
        {showErrors && errorCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {errorCount} {errorCount > 1 ? 'éléments à corriger' : 'élément à corriger'} avant d’enregistrer (voir
              les champs en rouge).
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{error}</AlertTitle>
            {details.length > 0 && (
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p role="status" className="flex items-center gap-1.5 text-sm sm:mr-auto">
            {saved ? (
              <span className="flex items-center gap-1.5 text-brand-700">
                <Check aria-hidden="true" className="size-4" /> Enregistré
              </span>
            ) : dirty ? (
              <span className="text-muted-foreground">Modifications non enregistrées</span>
            ) : null}
          </p>
          <ButtonLink href={cancelHref} variant="outline">
            {dirty ? 'Annuler' : 'Retour'}
          </ButtonLink>
          <Button type="submit" disabled={saving || (!dirty && !!survey)}>
            {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
            {survey ? 'Enregistrer' : 'Créer le brouillon'}
          </Button>
        </div>
      </div>
    </form>
  );
}