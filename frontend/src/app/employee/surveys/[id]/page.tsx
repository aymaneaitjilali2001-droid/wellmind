'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, CalendarClock, CircleCheck, Loader2, Lock, SearchX, Send } from 'lucide-react';
import { AnonymityNotice } from '@/components/employee-space/AnonymityNotice';
import { QuestionField } from '@/components/employee-space/QuestionField';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { isEmployeeSpaceKey, useMySurvey } from '@/hooks/useEmployeeSurveys';
import { getErrorMessage, type ApiErrorBody } from '@/lib/Api';
import {
  countAnswered,
  toAnswerInputs,
  validateAnswers,
  type AnswersState,
  type AnswerValue,
} from '@/lib/employee-answers';
import { getTimeLeft } from '@/lib/time-left';
import { submitSurvey } from '@/services/employee-surveys';
import type { SubmitResult } from '@/types/employee-survey';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Page centrée avec une icône et un message (merci, déjà répondu, fermé, introuvable)
function MessagePage({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span aria-hidden="true" className="[&_svg]:size-10">
        {icon}
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export default function AnswerSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: survey, error, isLoading, mutate } = useMySurvey(id ?? null);
  const { mutate: mutateCache } = useSWRConfig();

  const [answers, setAnswers] = useState<AnswersState>({});
  const [submitted, setSubmitted] = useState(false); // première tentative d'envoi faite
  const [acknowledged, setAcknowledged] = useState(false); // sondage identifié : case « j'ai compris »
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const dirty = Object.keys(answers).length > 0 && !result;

  // Avertir avant de quitter la page avec des réponses non envoyées
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement du sondage" />
      </div>
    );
  }

  const notFound = isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);
  if (notFound) {
    return (
      <MessagePage icon={<SearchX className="text-muted-foreground" />} title="Sondage introuvable">
        <p className="text-muted-foreground">Il a peut-être été clôturé ou n’est plus disponible.</p>
        <ButtonLink href="/employee" variant="outline" className="mt-2">
          Retour à mes sondages
        </ButtonLink>
      </MessagePage>
    );
  }

  if (error || !survey) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle />
        <AlertTitle>Impossible de charger le sondage</AlertTitle>
        <AlertDescription>
          <p>{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // ---------- Après l'envoi ----------
  if (result) {
    return (
      <MessagePage icon={<CircleCheck className="text-brand-600" />} title="Merci pour votre participation !">
        <p className="text-muted-foreground">{result.message}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/employee">Retour à mes sondages</ButtonLink>
          <ButtonLink href="/employee/history" variant="outline">
            Voir mon historique
          </ButtonLink>
        </div>
      </MessagePage>
    );
  }

  if (survey.alreadySubmitted) {
    return (
      <MessagePage icon={<CircleCheck className="text-brand-600" />} title="Vous avez déjà répondu">
        <p className="text-muted-foreground">Merci ! Une seule réponse par personne est possible pour ce sondage.</p>
        <ButtonLink href="/employee" variant="outline" className="mt-2">
          Retour à mes sondages
        </ButtonLink>
      </MessagePage>
    );
  }

  if (!survey.isOpen) {
    const notStarted = new Date(survey.startDate) > new Date();
    return (
      <MessagePage
        icon={notStarted ? <CalendarClock className="text-muted-foreground" /> : <Lock className="text-muted-foreground" />}
        title={notStarted ? 'Ce sondage n’est pas encore ouvert' : 'Ce sondage est terminé'}
      >
        <p className="text-muted-foreground">
          {notStarted
            ? `Vous pourrez répondre à partir du ${dateFormat.format(new Date(survey.startDate))}.`
            : 'Il n’accepte plus de réponses.'}
        </p>
        <ButtonLink href="/employee" variant="outline" className="mt-2">
          Retour à mes sondages
        </ButtonLink>
      </MessagePage>
    );
  }

  // ---------- Formulaire ----------
  const questions = survey.questions;
  const localErrors = submitted ? validateAnswers(questions, answers) : {};
  const errors = { ...serverFieldErrors, ...localErrors };
  const answered = countAnswered(questions, answers);
  const needsAck = !survey.isAnonymous && !acknowledged;
  const timeLeft = getTimeLeft(survey.endDate);

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setServerFieldErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);

    const found = validateAnswers(questions, answers);
    const firstId = questions.find((q) => found[q._id])?._id;
    if (firstId) {
      // Aller à la première question à corriger
      document.getElementById(`question-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (needsAck) return;

    setSending(true);
    try {
      const res = await submitSurvey(survey._id, toAnswerInputs(questions, answers));
      setResult(res);
      await mutateCache(isEmployeeSpaceKey); // liste « à répondre » et historique
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (isAxiosError<ApiErrorBody>(err) && err.response?.status === 409) {
        // Déjà répondu (autre onglet, double clic…) : on recharge le sondage
        await mutate();
        return;
      }
      // 400 : erreurs par question renvoyées par le backend
      const list = isAxiosError<ApiErrorBody>(err)
        ? ((err.response?.data?.details as { errors?: { questionId: string; message: string }[] })?.errors ?? [])
        : [];
      setServerFieldErrors(Object.fromEntries(list.map((x) => [String(x.questionId), x.message])));
      setServerError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/employee"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Mes sondages
      </Link>

      <header>
        {survey.topic && <p className="text-sm font-medium text-primary">{survey.topic}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-balance">{survey.title}</h1>
        {survey.description && <p className="mt-2 text-muted-foreground">{survey.description}</p>}
        <p className={timeLeft.urgent ? 'mt-2 text-sm font-medium text-amber-700' : 'mt-2 text-sm text-muted-foreground'}>
          {timeLeft.label} · jusqu’au {dateFormat.format(new Date(survey.endDate))}
        </p>
      </header>

      <AnonymityNotice isAnonymous={survey.isAnonymous} notice={survey.anonymityNotice} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionField
            key={q._id}
            question={q}
            index={i}
            value={answers[q._id]}
            error={errors[q._id]}
            onChange={(v) => setAnswer(q._id, v)}
          />
        ))}

        {/* Barre d'envoi, collée en bas de l'écran */}
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {!survey.isAnonymous && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--primary)]"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>
                J’ai compris que ce sondage est <strong>identifié</strong> : les RH pourront voir que ces réponses
                viennent de moi.
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {answered} / {questions.length} question{questions.length > 1 ? 's' : ''} répondue
              {answered > 1 ? 's' : ''}
              {submitted && errorCount > 0 && (
                <span className="text-destructive">
                  {' '}
                  · {errorCount} à compléter
                </span>
              )}
            </p>
            <Button type="submit" disabled={sending || needsAck}>
              {sending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
              Envoyer mes réponses
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Une fois envoyées, vos réponses ne peuvent plus être modifiées.</p>
        </div>
      </form>
    </div>
  );
}