'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ArrowLeft } from 'lucide-react';
import { SurveyEditor } from '@/components/surveys/editor/SurveyEditor';
import { isSurveysKey } from '@/hooks/useSurveys';
import type { Survey } from '@/types/survey';

export default function NewSurveyPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // Après la création : les listes sont rechargées et on continue dans l'éditeur du brouillon
  const handleSaved = async (survey: Survey) => {
    await mutate(isSurveysKey);
    router.replace(`/hr/surveys/${survey._id}/edit`);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/hr/surveys"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Sondages
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Nouveau sondage</h1>
        <p className="mt-1 text-muted-foreground">
          Le sondage est enregistré en brouillon : les employés ne le verront qu’une fois publié.
        </p>
      </div>

      <SurveyEditor cancelHref="/hr/surveys" onSaved={handleSaved} />
    </div>
  );
}