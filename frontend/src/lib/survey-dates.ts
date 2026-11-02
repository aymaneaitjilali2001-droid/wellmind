import type { SurveyStatus } from '@/types/survey';

// ---------------------------------------------------------------
// Dates des sondages : affichage et « moment » d'un sondage publié.
// ---------------------------------------------------------------

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// « 1 oct. – 31 oct. 2026 », « Du 1 oct. 2026 », « Dates non définies »
export const formatDateRange = (start?: string, end?: string): string => {
  if (!start && !end) return 'Dates non définies';
  if (start && !end) return `À partir du ${dayMonthYear.format(new Date(start))}`;
  if (!start && end) return `Jusqu’au ${dayMonthYear.format(new Date(end))}`;
  const s = new Date(start as string);
  const e = new Date(end as string);
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(s)} – ${dayMonthYear.format(e)}`;
};

// Le « moment » d'un sondage, plus précis que son statut :
// un sondage publié peut être à venir, ouvert, ou terminé sans avoir été clôturé.
export type SurveyTiming = 'draft' | 'scheduled' | 'open' | 'ended' | 'closed';

export const getSurveyTiming = (
  survey: { status: SurveyStatus; startDate?: string; endDate?: string },
  now: Date = new Date()
): SurveyTiming => {
  if (survey.status === 'DRAFT') return 'draft';
  if (survey.status === 'CLOSED') return 'closed';
  if (survey.startDate && now < new Date(survey.startDate)) return 'scheduled';
  if (survey.endDate && now > new Date(survey.endDate)) return 'ended';
  return 'open';
};

// ---------------------------------------------------------------
// Conversion entre le champ <input type="date"> (AAAA-MM-JJ) et le backend.
// Le début est fixé à 00:00 et la fin à 23:59:59 (heure locale) :
// sans ça, un sondage « jusqu'au 31 » se fermerait le 31 à minuit, en début de journée.
// ---------------------------------------------------------------

export const dateInputToStartISO = (value: string) => (value ? new Date(`${value}T00:00:00`).toISOString() : undefined);

export const dateInputToEndISO = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : undefined);

// Date ISO du backend → valeur d'un <input type="date">, en heure locale
export const isoToDateInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};