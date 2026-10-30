// ---------------------------------------------------------------
// seed.js — données de démonstration (DÉVELOPPEMENT UNIQUEMENT)
//
// Lancer depuis backend/src :  npm run seed
//
// - Refuse de s'exécuter si NODE_ENV=production.
// - Ne touche QUE l'organisation de démo (slug "wellmind-demo") :
//   ses documents sont supprimés puis recréés à chaque exécution,
//   les autres organisations de la base ne sont jamais modifiées.
// - Identifiants déterministes : les mêmes _id à chaque exécution.
// - Mot de passe des comptes : SEED_PASSWORD (ou valeur de dev par défaut).
//
// Contenu :
//  1 organisation, 2 RH, 8 employés (dont 1 désactivé)
//  4 sondages : CLOSED anonyme (6 réponses, au-dessus du seuil),
//               CLOSED identifié (3 réponses, sous le seuil),
//               PUBLISHED anonyme (2 réponses, ouvert), DRAFT
//  Réponses + participations (sans lien entre elles pour l'anonymat)
//  2 analyses IA (1 FAILED, 1 DONE avec thèmes et recommandations)
//  4 actions d'amélioration (une créée depuis une recommandation)
// ---------------------------------------------------------------

import crypto from 'node:crypto';
import mongoose from 'mongoose';
import connectToMongoDB from './connect.js';
import Organization from '../models/organizations.models.js';
import User from '../models/User.models.js';
import Survey from '../models/surveys.models.js';
import Response from '../models/responses.models.js';
import Participation from '../models/participations.models.js';
import AiAnalysis from '../models/aiAnalyses.models.js';
import ImprovementAction from '../models/improvementActions.models.js';
import { hashPassword, validatePassword } from '../utils/Password.js';
import { redact } from '../utils/Redact.js';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed refusé : NODE_ENV=production. Ce script est réservé au développement.');
  process.exit(1);
}

const ORG_SLUG = 'wellmind-demo';
const EMAIL_DOMAIN = 'wellmind-demo.test';
// Mot de passe de développement uniquement, jamais utilisé en production
const PASSWORD = process.env.SEED_PASSWORD || 'WellMind2026';

// ---------- Helpers ----------

// ObjectId stable dérivé d'une clé : mêmes _id à chaque exécution
const oid = (key) =>
  new mongoose.Types.ObjectId(crypto.createHash('sha1').update(`wellmind-seed:${key}`).digest('hex').slice(0, 24));

// ObjectId stable dont l'horodatage ne garde que le jour (comme anonymousObjectId) :
// impossible de relier une réponse anonyme à une participation par l'heure
const dayOid = (key, date) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  const bytes = crypto.createHash('sha1').update(`wellmind-seed:${key}`).digest().subarray(0, 12);
  bytes.writeUInt32BE(Math.floor(day.getTime() / 1000), 0);
  return new mongoose.Types.ObjectId(bytes);
};

const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setUTCHours(9, 0, 0, 0);
const daysFromNow = (n) => new Date(today.getTime() + n * DAY);

// Mélange déterministe : l'ordre des réponses ne suit pas celui des participations
const shuffle = (arr, salt) =>
  [...arr].sort((a, b) =>
    crypto.createHash('md5').update(salt + a.key).digest('hex').localeCompare(
      crypto.createHash('md5').update(salt + b.key).digest('hex')
    )
  );

// ---------- Données ----------

const ORG_ID = oid('org');

const HR = [
  { key: 'hr1', firstName: 'Amina', lastName: 'Rahmani', email: 'rh.admin', department: 'RH' },
  { key: 'hr2', firstName: 'Karim', lastName: 'Belkacem', email: 'rh.manager', department: 'RH' },
];

const EMPLOYEES = [
  { key: 'e1', firstName: 'Sara', lastName: 'Benali', department: 'IT' },
  { key: 'e2', firstName: 'Youssef', lastName: 'Haddad', department: 'IT' },
  { key: 'e3', firstName: 'Lina', lastName: 'Mansour', department: 'Marketing' },
  { key: 'e4', firstName: 'Omar', lastName: 'Kadri', department: 'Finance' },
  { key: 'e5', firstName: 'Nadia', lastName: 'Tazi', department: 'Marketing' },
  { key: 'e6', firstName: 'Hugo', lastName: 'Martin', department: 'IT' },
  { key: 'e7', firstName: 'Ines', lastName: 'Moreau', department: 'Finance' },
  { key: 'e8', firstName: 'Leo', lastName: 'Garnier', department: 'IT', isActive: false },
].map((e) => ({ ...e, email: `${e.firstName}.${e.lastName}`.toLowerCase() }));

const ALL_USERS = [
  ...HR.map((u) => ({ ...u, role: 'HR_ADMIN' })),
  ...EMPLOYEES.map((u) => ({ ...u, role: 'EMPLOYEE' })),
].map((u) => ({ ...u, _id: oid(`user:${u.key}`), email: `${u.email}@${EMAIL_DOMAIN}` }));

const userId = (key) => ALL_USERS.find((u) => u.key === key)._id;

// Questions avec _id stables (utilisés par responses.answers.questionId)
const q = (surveyKey, i, def) => ({
  _id: oid(`q:${surveyKey}:${i}`),
  position: i,
  ...def,
  ...(def.options && {
    options: def.options.map((label, j) => ({ _id: oid(`opt:${surveyKey}:${i}:${j}`), label, position: j })),
  }),
});

const SURVEYS = {
  s1: {
    title: 'Baromètre bien-être — T3 2026',
    description: 'Point trimestriel sur la charge de travail, l’équilibre et le télétravail.',
    topic: 'Charge de travail',
    isAnonymous: true,
    status: 'CLOSED',
    startDate: daysFromNow(-60),
    endDate: daysFromNow(-30),
    publishedAt: daysFromNow(-60),
    closedAt: daysFromNow(-30),
    questions: [
      q('s1', 0, { label: 'Comment évaluez-vous votre charge de travail ?', type: 'RATING', isRequired: true, scaleMin: 1, scaleMax: 5, minLabel: 'Très difficile', maxLabel: 'Très gérable' }),
      q('s1', 1, { label: 'Comment évaluez-vous l’équilibre vie professionnelle / vie personnelle ?', type: 'RATING', isRequired: true, scaleMin: 1, scaleMax: 5 }),
      q('s1', 2, { label: 'Combien de jours de télétravail souhaitez-vous par semaine ?', type: 'CHOICE', isRequired: true, options: ['Aucun', '1 à 2 jours', '3 jours ou plus'] }),
      q('s1', 3, { label: 'Qu’est-ce qui améliorerait votre quotidien au travail ?', type: 'TEXT' }),
    ],
  },
  s2: {
    title: 'Retour sur la formation sécurité',
    description: 'Sondage identifié : vos réponses sont visibles par les RH.',
    topic: 'Formation',
    isAnonymous: false,
    status: 'CLOSED',
    startDate: daysFromNow(-45),
    endDate: daysFromNow(-35),
    publishedAt: daysFromNow(-45),
    closedAt: daysFromNow(-35),
    questions: [
      q('s2', 0, { label: 'La formation vous a-t-elle été utile ?', type: 'RATING', isRequired: true, scaleMin: 1, scaleMax: 5 }),
      q('s2', 1, { label: 'Le format vous convenait-il ?', type: 'CHOICE', isRequired: true, options: ['Oui', 'Non'] }),
    ],
  },
  s3: {
    title: 'Pulse mensuel — octobre 2026',
    description: 'Trois questions rapides sur votre mois.',
    topic: 'Bien-être',
    isAnonymous: true,
    status: 'PUBLISHED',
    startDate: daysFromNow(-7),
    endDate: daysFromNow(14),
    publishedAt: daysFromNow(-7),
    questions: [
      q('s3', 0, { label: 'Comment vous sentez-vous ce mois-ci ?', type: 'RATING', isRequired: true, scaleMin: 1, scaleMax: 5 }),
      q('s3', 1, { label: 'Votre charge de travail a-t-elle évolué ?', type: 'CHOICE', isRequired: true, options: ['En baisse', 'Stable', 'En hausse'] }),
      q('s3', 2, { label: 'Un commentaire ?', type: 'TEXT' }),
    ],
  },
  s4: {
    title: 'Communication interne 2026',
    description: 'Brouillon en préparation.',
    topic: 'Communication',
    isAnonymous: true,
    status: 'DRAFT',
    questions: [
      q('s4', 0, { label: 'Êtes-vous informé des décisions importantes ?', type: 'RATING', isRequired: true, scaleMin: 1, scaleMax: 5 }),
      q('s4', 1, { label: 'Quel canal préférez-vous ?', type: 'CHOICE', options: ['E-mail', 'Réunion', 'Messagerie'] }),
      q('s4', 2, { label: 'Vos suggestions', type: 'TEXT' }),
    ],
  },
};

// Réponses : [employé, valeurs par question] ; CHOICE = indice de l'option
const ANSWERS = {
  s1: [
    ['e1', [2, 3, 1, 'Les priorités changent trop souvent, la charge devient difficile à planifier.']],
    ['e2', [3, 3, 2, 'Trop de réunions sans compte rendu, la communication sur les décisions arrive tard.']],
    ['e3', [2, 2, 1, 'La charge de travail est forte en fin de mois, avec des délais très courts.']],
    ['e4', [4, 4, 0, 'Bonne ambiance dans l’équipe, Sara Benali nous aide beaucoup.']],
    ['e5', [3, 2, 2, 'Plus de communication de la part du manager sur les objectifs.']],
    ['e6', [2, 3, 1, 'Les priorités urgentes s’enchaînent, mais l’entraide dans l’équipe reste forte.']],
  ],
  s2: [
    ['e1', [4, 0]],
    ['e3', [5, 0]],
    ['e4', [3, 1]],
  ],
  s3: [
    ['e2', [4, 1, 'Mois plus calme, merci pour la nouvelle organisation.']],
    ['e5', [3, 2, null]],
  ],
};

// ---------- Construction ----------

const buildAnswers = (survey, values, names) =>
  survey.questions
    .map((question, i) => {
      const v = values[i];
      if (v === null || v === undefined) return null;
      if (question.type === 'RATING') return { questionId: question._id, questionType: 'RATING', ratingValue: v };
      if (question.type === 'CHOICE') return { questionId: question._id, questionType: 'CHOICE', optionId: question.options[v]._id };
      return { questionId: question._id, questionType: 'TEXT', textValue: v, textRedacted: redact(v, names) };
    })
    .filter(Boolean);

const cleanup = async () => {
  // Organisation de démo (par _id stable ou par slug si elle a été recréée autrement)
  const existing = await Organization.find({ $or: [{ _id: ORG_ID }, { slug: ORG_SLUG }] }).select('_id').lean();
  const orgIds = [ORG_ID, ...existing.map((o) => o._id)];
  const byOrg = { organizationId: { $in: orgIds } };

  const results = await Promise.all([
    ImprovementAction.deleteMany(byOrg),
    AiAnalysis.deleteMany(byOrg),
    Response.deleteMany(byOrg),
    Participation.deleteMany(byOrg),
    Survey.deleteMany(byOrg),
    User.deleteMany({ $or: [byOrg, { email: { $in: ALL_USERS.map((u) => u.email) } }] }),
  ]);
  const org = await Organization.deleteMany({ _id: { $in: orgIds } });
  const total = results.reduce((s, r) => s + r.deletedCount, 0) + org.deletedCount;
  console.log(`🧹 Nettoyage de l'organisation de démo : ${total} document(s) supprimé(s)`);
};

const seed = async () => {
  validatePassword(PASSWORD);
  await connectToMongoDB();
  console.log(`⚙️  Base : ${mongoose.connection.name} — organisation de démo : ${ORG_SLUG}`);

  // Index uniques (email, participation, recommendationId) avant d'insérer
  await Promise.all([Organization, User, Survey, Response, Participation, AiAnalysis, ImprovementAction].map((m) => m.init()));

  await cleanup();

  // 1. Organisation
  await Organization.create({
    _id: ORG_ID,
    name: 'WellMind Démo',
    slug: ORG_SLUG,
    industry: 'Services numériques',
    size: 40,
    minResponseThreshold: 5,
    departments: ['RH', 'IT', 'Marketing', 'Finance'],
  });

  // 2. Utilisateurs
  const passwordHash = await hashPassword(PASSWORD);
  for (const u of ALL_USERS) {
    await User.create({
      _id: u._id,
      organizationId: ORG_ID,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      passwordHash,
      role: u.role,
      department: u.department,
      isActive: u.isActive ?? true,
    });
  }
  const names = ALL_USERS.flatMap((u) => [u.firstName, u.lastName]);

  // 3. Sondages
  const surveys = {};
  for (const [key, def] of Object.entries(SURVEYS)) {
    surveys[key] = await Survey.create({ _id: oid(`survey:${key}`), organizationId: ORG_ID, createdBy: userId('hr1'), ...def });
  }

  // 4. Participations (QUI) et réponses (QUOI), sans aucun lien entre elles
  let participationCount = 0;
  let responseCount = 0;
  for (const [key, rows] of Object.entries(ANSWERS)) {
    const survey = surveys[key];
    const submittedOn = survey.status === 'CLOSED' ? daysFromNow(-40) : daysFromNow(-3);
    const entries = rows.map(([empKey, values]) => ({ key: `${key}:${empKey}`, empKey, values }));

    for (const { key: k, empKey } of entries) {
      await Participation.create({
        _id: dayOid(`participation:${k}`, submittedOn),
        organizationId: ORG_ID,
        surveyId: survey._id,
        userId: userId(empKey),
        submittedOn,
      });
      participationCount++;
    }

    for (const { key: k, empKey, values } of shuffle(entries, key)) {
      const user = ALL_USERS.find((u) => u.key === empKey);
      await Response.create({
        _id: dayOid(`response:${k}`, submittedOn),
        organizationId: ORG_ID,
        surveyId: survey._id,
        isAnonymous: survey.isAnonymous,
        userId: survey.isAnonymous ? null : user._id,
        department: user.department,
        submittedOn,
        answers: buildAnswers(survey, values, names),
      });
      responseCount++;
    }
  }

  // 5. Analyses IA du baromètre (s1)
  const s1 = surveys.s1;
  const comments = await Response.getRedactedComments(s1._id);
  const statistics = await Response.getAggregatedStats(s1._id, s1.getSortedQuestions());
  const excerpt = (needle) => comments.find((c) => c.text.includes(needle)).text;

  await AiAnalysis.create({
    _id: oid('analysis:failed'),
    organizationId: ORG_ID,
    surveyId: s1._id,
    requestedBy: userId('hr1'),
    status: 'FAILED',
    responseCount: ANSWERS.s1.length,
    commentCount: comments.length,
    errorMessage: 'Service IA injoignable',
  });

  const recIds = { r1: oid('rec:r1'), r2: oid('rec:r2'), r3: oid('rec:r3') };
  const themeIds = { t1: oid('theme:t1'), t2: oid('theme:t2'), t3: oid('theme:t3') };
  const actionFromRecId = oid('action:a1');

  const analysis = await AiAnalysis.create({
    _id: oid('analysis:done'),
    organizationId: ORG_ID,
    surveyId: s1._id,
    requestedBy: userId('hr1'),
    status: 'DONE',
    summary: 'Les retours soulignent une charge de travail difficile à planifier et un besoin de communication plus régulière, avec une entraide appréciée au sein des équipes.',
    responseCount: ANSWERS.s1.length,
    commentCount: comments.length,
    statistics,
    aiGenerated: true,
    aiModel: 'seed-demo',
    limitations: ['Données de démonstration créées par le seed, non produites par un modèle de langage.'],
    themes: [
      {
        _id: themeIds.t1,
        name: 'Organisation de la charge de travail',
        sentiment: 'CONCERN',
        description: 'Des priorités changeantes et des délais courts rendent la charge difficile à planifier.',
        mentionCount: 3,
        excerpts: [excerpt('priorités changent'), excerpt('fin de mois')],
        recommendations: [
          {
            _id: recIds.r1,
            content: 'Organiser un point hebdomadaire de priorisation au sein de chaque équipe.',
            rationale: 'Plusieurs retours mentionnent des changements de priorités fréquents.',
            status: 'ACCEPTED',
            reviewedBy: userId('hr1'),
            reviewedAt: daysFromNow(-20),
            actionId: actionFromRecId,
          },
          {
            _id: recIds.r2,
            content: 'Lisser les échéances de fin de mois sur plusieurs semaines.',
            rationale: 'Des retours évoquent des pics de charge en fin de mois.',
          },
        ],
      },
      {
        _id: themeIds.t2,
        name: 'Communication interne',
        sentiment: 'CONCERN',
        description: 'Les décisions et objectifs sont communiqués tardivement.',
        mentionCount: 2,
        excerpts: [excerpt('compte rendu')],
        recommendations: [
          {
            _id: recIds.r3,
            content: 'Envoyer un compte rendu écrit après chaque réunion de décision.',
            rationale: 'Les retours signalent un manque d’information sur les décisions.',
            status: 'REJECTED',
            reviewedBy: userId('hr2'),
            reviewedAt: daysFromNow(-18),
          },
        ],
      },
      {
        _id: themeIds.t3,
        name: "Entraide au sein de l'équipe",
        sentiment: 'POSITIVE',
        description: "L'entraide entre collègues est citée comme un point fort.",
        mentionCount: 2,
        excerpts: [excerpt('Bonne ambiance')],
        recommendations: [],
      },
    ],
  });

  // 6. Actions d'amélioration
  const newAction = (key, def, transitions = []) => {
    const action = new ImprovementAction({ _id: oid(`action:${key}`), organizationId: ORG_ID, createdBy: userId('hr1'), ...def });
    action.addUpdate(userId('hr1'), def.recommendationId ? "Action créée à partir d'une recommandation de l'analyse IA" : 'Action créée');
    for (const status of transitions) action.changeStatus(status, userId('hr1'));
    return action.save();
  };

  await newAction(
    'a1',
    {
      title: 'Point hebdomadaire de priorisation',
      objective: 'Réduire les changements de priorités non anticipés.',
      topic: 'Organisation de la charge de travail',
      surveyId: s1._id,
      analysisId: analysis._id,
      themeId: themeIds.t1,
      recommendationId: recIds.r1,
      ownerId: userId('hr2'),
      targetDate: daysFromNow(30),
      visibleToEmployees: true,
    },
    ['IN_PROGRESS']
  );
  await newAction('a2', {
    title: 'Programme de reconnaissance des réalisations',
    objective: 'Valoriser les projets terminés lors des réunions mensuelles.',
    topic: 'Reconnaissance',
    ownerId: userId('hr1'),
    targetDate: daysFromNow(-5), // en retard
  });
  await newAction(
    'a3',
    {
      title: 'Charte du télétravail',
      objective: 'Clarifier les règles de télétravail (1 à 2 jours par semaine).',
      topic: 'Télétravail',
      surveyId: s1._id,
      ownerId: userId('hr1'),
      targetDate: daysFromNow(-2),
      visibleToEmployees: true,
    },
    ['IN_PROGRESS', 'DONE']
  );
  await newAction(
    'a4',
    {
      title: 'Atelier gestion du stress',
      topic: 'Bien-être',
      ownerId: userId('hr2'),
      targetDate: daysFromNow(20),
    },
    ['CANCELLED']
  );

  // ---------- Résumé ----------
  console.log('\n✅ Seed terminé');
  console.log(`   Organisation : WellMind Démo (${ORG_SLUG}), seuil de confidentialité : 5 réponses`);
  console.log(`   Utilisateurs : ${ALL_USERS.length} | Sondages : ${Object.keys(surveys).length} | Participations : ${participationCount} | Réponses : ${responseCount}`);
  console.log('   Analyses IA : 2 (1 FAILED, 1 DONE) | Actions : 4');

  console.log('\n🔑 Comptes de test (DÉVELOPPEMENT UNIQUEMENT)');
  console.table(
    ALL_USERS.map((u) => ({
      rôle: u.role,
      nom: `${u.firstName} ${u.lastName}`,
      service: u.department,
      email: u.email,
      'mot de passe': PASSWORD,
      actif: u.isActive ?? true ? 'oui' : 'non',
    }))
  );

  console.log('📋 Sondages');
  console.table(
    Object.entries(surveys).map(([key, s]) => ({
      id: s._id.toString(),
      titre: s.title,
      statut: s.status,
      anonyme: s.isAnonymous ? 'oui' : 'non',
      réponses: (ANSWERS[key] || []).length,
    }))
  );
};

seed()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error('❌ Seed échoué :', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
