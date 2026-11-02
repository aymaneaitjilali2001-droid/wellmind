/*GET /api/stats/surveys/:id
             |
             v
     Vérifier le sondage
             |
             v
   Appartient-il à l'organisation ?
             |
             v
       Est-il CLOSED ?
             |
             v
    Compter les réponses
             |
             v
   Vérifier le seuil minimum
             |
             v
 Response.getAggregatedStats()
             |
             v
       Retourner les stats*/
import Survey from '../models/surveys.models.js';
import Response from '../models/responses.models.js';
import Organization from '../models/organizations.models.js';
import Participation from '../models/participations.models.js';
import { countEligible, toRate } from './participation.controller.js';
import { withBreakdown } from '../utils/Statistics.js';
import { HttpError } from '../utils/Httperror.js';

// GET /api/stats/surveys/:id
// Retourne les statistiques chiffrées d'un sondage pour les RH.
export const getSurveyStats = async (req, res) => {
  const organizationId = req.user.organizationId;

  // 1. Vérifier que le sondage appartient à l'organisation du RH.
  const survey = await Survey.findOne({
    _id: req.params.id,
    organizationId,
  });

  if (!survey) {
    throw new HttpError(404, 'Sondage introuvable');
  }

  // 2. Les statistiques sont disponibles uniquement après clôture.
  if (survey.status !== 'CLOSED') {
    throw new HttpError(
      409,
      'Les statistiques sont disponibles uniquement pour les sondages clôturés'
    );
  }

  // 3. Récupérer le seuil minimal de réponses de l'organisation.
  const organization = await Organization.findById(organizationId)
    .select('minResponseThreshold')
    .lean();

  const threshold = organization?.minResponseThreshold || 5;

  // 4. Compter les réponses au sondage.
  const responseCount = await Response.countForSurvey(survey._id);

  // 5. Vérifier le seuil de confidentialité.
  if (responseCount < threshold) {
    throw new HttpError(
      422,
      `Nombre de réponses insuffisant. Minimum requis : ${threshold}`
    );
  }

  // 6. Calculer les statistiques RATING et CHOICE.
  const questions = survey.getSortedQuestions();

  const statistics = await Response.getAggregatedStats(
    survey._id,
    questions
  );

    // 7. Calculer la participation.
  const [participants, eligible] = await Promise.all([
    Participation.countForSurvey(survey._id),
    countEligible(organizationId),
  ]);

  // 8. Retourner les résultats chiffrés.
  res.json({
    surveyId: survey._id,
    title: survey.title,
    responseCount,
    participation: {
      participants,
      eligible,
      rate: toRate(participants, eligible),
    },
    statistics: statistics.map((stat) =>
      withBreakdown(stat, questions.find((q) => q._id.toString() === stat.questionId))
    ),
  });
};
