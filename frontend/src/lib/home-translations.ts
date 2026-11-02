// ---------------------------------------------------------------
// Textes de la landing page, en français et en anglais.
// Le français sert de modèle : l'anglais doit avoir exactement les mêmes clés,
// sinon TypeScript signale l'erreur.
// ---------------------------------------------------------------

export type Lang = 'fr' | 'en';

const fr = {
  nav: {
    features: 'Fonctionnalités',
    howItWorks: 'Comment ça marche',
    privacy: 'Confidentialité',
    faq: 'FAQ',
    login: 'Se connecter',
    start: 'Commencer',
    languageLabel: 'Choisir la langue',
    mainNav: 'Navigation principale',
    home: 'WellMind, retour à l’accueil',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
  },
  hero: {
    badge: 'Plateforme de bien-être au travail assistée par l’IA',
    title: 'Construisez un environnement de travail plus sain et plus épanouissant.',
    description:
      'WellMind aide les organisations à comprendre le bien-être de leurs employés grâce à des sondages, des analyses intelligentes et des actions d’amélioration concrètes.',
    ctaPrimary: 'Créer mon organisation',
    ctaSecondary: 'Se connecter',
    reassurance:
      'Sondages anonymes ou identifiés, au choix des RH. Les résultats restent masqués tant qu’un nombre minimal de réponses n’est pas atteint.',
  },
  dashboard: {
    ariaLabel: 'Aperçu illustratif du tableau de bord WellMind, avec des données fictives',
    windowTitle: 'Tableau de bord RH',
    illustrative: 'Données d’illustration',
    wellbeingScore: 'Score de bien-être',
    outOf: '/ 10',
    participation: 'Participation',
    participationNote: 'des employés ont répondu',
    trend: 'Évolution du score',
    months: ['Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.'],
    themes: 'Satisfaction par thème',
    themeLabels: {
      communication: 'Communication',
      workload: 'Charge de travail',
      recognition: 'Reconnaissance',
    },
    aiTitle: 'Recommandation IA',
    aiText: 'Organiser un point hebdomadaire de priorisation au sein des équipes.',
    aiNote: 'Proposée à partir des commentaires désidentifiés',
    privacyTitle: 'Anonymat protégé',
    privacyText: 'Résultats visibles dès 5 réponses (par défaut)',
  },
  benefits: {
    eyebrow: 'Pourquoi WellMind',
    title: 'Des retours des employés aux décisions concrètes',
    description:
      'Écouter ne suffit pas : WellMind vous aide à comprendre ce qui se passe dans vos équipes, puis à agir et à mesurer les effets.',
    items: [
      {
        title: 'Comprendre vos équipes',
        text: 'Recueillez régulièrement le ressenti des employés sur la charge de travail, la communication ou la reconnaissance.',
      },
      {
        title: 'Repérer les points de friction',
        text: 'Les résultats et les thèmes récurrents font ressortir les sujets qui demandent de l’attention.',
      },
      {
        title: 'Transformer les retours en actions',
        text: 'Chaque constat peut devenir une action d’amélioration, avec un responsable et une échéance.',
      },
      {
        title: 'Suivre l’évolution',
        text: 'Comparez les résultats au fil des sondages pour voir si les actions portent leurs fruits.',
      },
    ],
  },
  features: {
    eyebrow: 'Fonctionnalités',
    title: 'Tout ce qu’il faut pour écouter, comprendre et agir',
    description: 'Une seule plateforme pour les responsables RH et les employés, du sondage au plan d’action.',
    items: [
      {
        title: 'Sondages employés',
        text: 'Questions à échelle, à choix ou ouvertes, en mode anonyme ou identifié, publiées sur une période définie.',
      },
      {
        title: 'Analyse assistée par l’IA',
        text: 'Les commentaires désidentifiés sont regroupés en thèmes, avec un résumé et des extraits, dès que les réponses sont assez nombreuses.',
      },
      {
        title: 'Actions d’amélioration',
        text: 'Les recommandations deviennent des actions suivies : responsable, échéance, statut et notes de suivi.',
      },
      {
        title: 'Tableau de bord RH',
        text: 'Taux de participation, moyennes et répartitions des réponses, pour suivre l’évolution du bien-être.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'Comment ça marche',
    title: 'Trois étapes, de la question à l’action',
    description: 'Un cycle simple, que vous pouvez répéter pour mesurer les progrès dans le temps.',
    stepLabel: 'Étape',
    steps: [
      {
        title: 'Créer un sondage',
        text: 'Le responsable RH choisit les questions (échelle, choix ou réponse libre), le mode anonyme ou identifié et la période de réponse.',
      },
      {
        title: 'Recueillir les retours',
        text: 'Les employés voient les sondages ouverts et y répondent en quelques minutes. Chacun ne peut répondre qu’une seule fois.',
      },
      {
        title: 'Analyser et améliorer',
        text: 'Les RH consultent les résultats, lancent l’analyse des commentaires et transforment les constats en actions suivies.',
      },
    ],
  },
  audience: {
    eyebrow: 'Pour qui',
    title: 'Une expérience pensée pour chaque rôle',
    hr: {
      title: 'Pour les responsables RH',
      text: 'Pilotez l’écoute de vos équipes et le suivi des améliorations.',
      points: [
        'Créer, publier et clôturer des sondages',
        'Suivre la participation et les résultats',
        'Lancer l’analyse IA et examiner les recommandations',
        'Piloter les actions d’amélioration',
      ],
    },
    employee: {
      title: 'Pour les employés',
      text: 'Donnez votre avis simplement, en sachant comment il sera utilisé.',
      points: [
        'Voir les sondages ouverts et y répondre',
        'Savoir avant de répondre si le sondage est anonyme',
        'Retrouver l’historique de ses participations',
        'Consulter les actions partagées par les RH',
      ],
    },
  },
  privacy: {
    eyebrow: 'Confidentialité',
    title: 'La confiance commence par la confidentialité.',
    description:
      'Les employés ne partagent un avis sincère que s’ils savent comment leurs réponses sont traitées. Voici les règles appliquées par WellMind.',
    items: [
      {
        title: 'Réponses non reliées au compte',
        text: 'Dans un sondage anonyme, la réponse est enregistrée sans l’identifiant de l’employé, séparément de sa participation. Seul le jour d’envoi est conservé, pas l’heure.',
      },
      {
        title: 'Seuil minimal de réponses',
        text: 'Les résultats détaillés et l’analyse IA restent masqués tant qu’un nombre minimal de réponses n’est pas atteint : 5 par défaut, réglable entre 3 et 50.',
      },
      {
        title: 'Commentaires désidentifiés',
        text: 'Avant l’analyse IA, les noms, adresses e-mail et numéros de téléphone sont masqués automatiquement dans les commentaires écrits.',
      },
      {
        title: 'Données séparées par organisation',
        text: 'Chaque organisation accède uniquement à ses propres employés, sondages et résultats.',
      },
      {
        title: 'Participation sans liste nominative',
        text: 'Les RH voient le taux de participation, mais pas la liste des personnes qui ont répondu.',
      },
    ],
    noteTitle: 'Bon à savoir',
    note: 'Les RH peuvent aussi créer des sondages identifiés, où les réponses sont reliées à leur auteur : l’employé en est toujours informé avant de répondre. La désidentification automatique réduit les risques, mais évitez d’inclure des détails personnels dans vos commentaires.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    items: [
      {
        question: 'Qu’est-ce que WellMind ?',
        answer: 'WellMind est une plateforme qui aide les organisations à mesurer le bien-être au travail grâce à des sondages, à analyser les retours des employés et à suivre des actions d’amélioration.',
      },
      {
        question: 'Comment fonctionne WellMind ?',
        answer: 'Les responsables RH créent et publient des sondages. Les employés y répondent pendant la période prévue. Les RH consultent ensuite les résultats, lancent l’analyse des commentaires et créent des actions d’amélioration qu’ils suivent dans le temps.',
      },
      {
        question: 'Les réponses des employés sont-elles anonymes ?',
        answer: 'Cela dépend du mode choisi par les RH pour chaque sondage, et l’employé en est informé avant de répondre. Dans un sondage anonyme, la réponse n’est pas reliée au compte de l’employé, et les résultats restent masqués tant qu’un nombre minimal de réponses n’est pas atteint. Dans un sondage identifié, les RH peuvent voir qui a répondu quoi.',
      },
      {
        question: 'Qui peut utiliser WellMind ?',
        answer: 'Un responsable RH crée l’organisation et son compte, puis ajoute les comptes des employés. Les employés ne s’inscrivent pas eux-mêmes : ils reçoivent leurs identifiants de leur organisation.',
      },
      {
        question: 'Comment fonctionne l’analyse par l’IA ?',
        answer: 'Les commentaires écrits, d’abord désidentifiés, sont analysés pour en faire ressortir des thèmes, un résumé et des recommandations. Les chiffres (nombre de réponses, moyennes) sont calculés par l’application, pas par l’IA. Les RH examinent chaque recommandation et décident de l’accepter ou non. L’analyse ne pose aucun diagnostic et n’évalue aucun employé individuellement.',
      },
      {
        question: 'Comment une organisation peut-elle commencer ?',
        answer: 'Créez votre organisation et votre compte RH, ajoutez vos services et les comptes de vos employés, puis créez et publiez votre premier sondage.',
      },
    ],
  },
  cta: {
    title: 'Prêt à construire un meilleur environnement de travail ?',
    description:
      'Créez votre organisation, ajoutez vos employés et lancez votre premier sondage pour mieux comprendre vos équipes.',
    primary: 'Commencer avec WellMind',
    secondary: 'Se connecter',
  },
  footer: {
    description:
      'La plateforme qui aide les organisations à écouter leurs employés et à améliorer le bien-être au travail.',
    product: 'Produit',
    access: 'Accès',
    login: 'Se connecter',
    register: 'Créer une organisation',
    rights: 'Tous droits réservés.',
    productNav: 'Liens vers les sections de la page',
    accessNav: 'Liens de connexion et d’inscription',
  },
};

export type Dictionary = typeof fr;

const en: Dictionary = {
  nav: {
    features: 'Features',
    howItWorks: 'How it works',
    privacy: 'Privacy',
    faq: 'FAQ',
    login: 'Log in',
    start: 'Get started',
    languageLabel: 'Choose language',
    mainNav: 'Main navigation',
    home: 'WellMind, back to home',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  hero: {
    badge: 'AI-powered employee well-being platform',
    title: 'Build a healthier and more engaging workplace.',
    description:
      'WellMind helps organizations understand employee well-being through surveys, intelligent insights, and meaningful improvement actions.',
    ctaPrimary: 'Create my organization',
    ctaSecondary: 'Log in',
    reassurance:
      'Anonymous or identified surveys, as chosen by HR. Results stay hidden until a minimum number of responses is reached.',
  },
  dashboard: {
    ariaLabel: 'Illustrative preview of the WellMind dashboard, with sample data',
    windowTitle: 'HR dashboard',
    illustrative: 'Sample data',
    wellbeingScore: 'Well-being score',
    outOf: '/ 10',
    participation: 'Participation',
    participationNote: 'of employees responded',
    trend: 'Score over time',
    months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    themes: 'Satisfaction by topic',
    themeLabels: {
      communication: 'Communication',
      workload: 'Workload',
      recognition: 'Recognition',
    },
    aiTitle: 'AI recommendation',
    aiText: 'Hold a weekly prioritization check-in within each team.',
    aiNote: 'Suggested from de-identified comments',
    privacyTitle: 'Anonymity protected',
    privacyText: 'Results shown from 5 responses (default)',
  },
  benefits: {
    eyebrow: 'Why WellMind',
    title: 'From employee feedback to concrete decisions',
    description:
      'Listening is not enough: WellMind helps you understand what is happening in your teams, then act and measure the impact.',
    items: [
      {
        title: 'Understand your teams',
        text: 'Regularly gather how employees feel about workload, communication or recognition.',
      },
      {
        title: 'Spot friction points',
        text: 'Results and recurring themes highlight the topics that need attention.',
      },
      {
        title: 'Turn feedback into action',
        text: 'Every finding can become an improvement action, with an owner and a due date.',
      },
      {
        title: 'Track progress',
        text: 'Compare results across surveys to see whether your actions are paying off.',
      },
    ],
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything you need to listen, understand and act',
    description: 'A single platform for HR managers and employees, from survey to action plan.',
    items: [
      {
        title: 'Employee surveys',
        text: 'Rating, multiple-choice or open questions, anonymous or identified, published over a set period.',
      },
      {
        title: 'AI-assisted analysis',
        text: 'De-identified comments are grouped into themes, with a summary and excerpts, once there are enough responses.',
      },
      {
        title: 'Improvement actions',
        text: 'Recommendations become tracked actions: owner, due date, status and follow-up notes.',
      },
      {
        title: 'HR dashboard',
        text: 'Participation rates, averages and response breakdowns to follow well-being over time.',
      },
    ],
  },
  howItWorks: {
    eyebrow: 'How it works',
    title: 'Three steps, from question to action',
    description: 'A simple cycle you can repeat to measure progress over time.',
    stepLabel: 'Step',
    steps: [
      {
        title: 'Create a survey',
        text: 'The HR manager picks the questions (rating, multiple choice or open text), the anonymous or identified mode and the response period.',
      },
      {
        title: 'Collect feedback',
        text: 'Employees see open surveys and answer them in a few minutes. Each person can only respond once.',
      },
      {
        title: 'Analyze and improve',
        text: 'HR reviews the results, runs the comment analysis and turns findings into tracked actions.',
      },
    ],
  },
  audience: {
    eyebrow: 'Who it’s for',
    title: 'An experience designed for each role',
    hr: {
      title: 'For HR managers',
      text: 'Lead how you listen to your teams and follow up on improvements.',
      points: [
        'Create, publish and close surveys',
        'Track participation and results',
        'Run the AI analysis and review recommendations',
        'Manage improvement actions',
      ],
    },
    employee: {
      title: 'For employees',
      text: 'Share your opinion easily, knowing how it will be used.',
      points: [
        'See open surveys and respond',
        'Know before answering whether a survey is anonymous',
        'Find the history of your participations',
        'View the actions shared by HR',
      ],
    },
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Trust starts with privacy.',
    description:
      'Employees only share honest feedback when they know how their answers are handled. Here are the rules WellMind applies.',
    items: [
      {
        title: 'Responses not linked to accounts',
        text: 'In an anonymous survey, the response is stored without the employee’s identifier, separately from their participation. Only the day of submission is kept, not the time.',
      },
      {
        title: 'Minimum response threshold',
        text: 'Detailed results and the AI analysis stay hidden until a minimum number of responses is reached: 5 by default, adjustable between 3 and 50.',
      },
      {
        title: 'De-identified comments',
        text: 'Before the AI analysis, names, email addresses and phone numbers are automatically masked in written comments.',
      },
      {
        title: 'Data separated by organization',
        text: 'Each organization can only access its own employees, surveys and results.',
      },
      {
        title: 'Participation without a list of names',
        text: 'HR sees the participation rate, but not the list of people who responded.',
      },
    ],
    noteTitle: 'Good to know',
    note: 'HR can also create identified surveys, where responses are linked to their author: employees are always told before they answer. Automatic de-identification reduces risk, but avoid including personal details in your comments.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What is WellMind?',
        answer: 'WellMind is a platform that helps organizations measure workplace well-being through surveys, analyze employee feedback and follow up on improvement actions.',
      },
      {
        question: 'How does WellMind work?',
        answer: 'HR managers create and publish surveys. Employees respond during the planned period. HR then reviews the results, runs the comment analysis and creates improvement actions they track over time.',
      },
      {
        question: 'Are employee responses anonymous?',
        answer: 'It depends on the mode HR chooses for each survey, and employees are told before they answer. In an anonymous survey, the response is not linked to the employee’s account, and results stay hidden until a minimum number of responses is reached. In an identified survey, HR can see who answered what.',
      },
      {
        question: 'Who can use WellMind?',
        answer: 'An HR manager creates the organization and their account, then adds employee accounts. Employees do not sign up themselves: they receive their credentials from their organization.',
      },
      {
        question: 'How does the AI analysis work?',
        answer: 'Written comments, de-identified first, are analyzed to bring out themes, a summary and recommendations. Figures (number of responses, averages) are calculated by the application, not by the AI. HR reviews each recommendation and decides whether to accept it. The analysis makes no diagnosis and does not assess any individual employee.',
      },
      {
        question: 'How can an organization get started?',
        answer: 'Create your organization and HR account, add your departments and employee accounts, then create and publish your first survey.',
      },
    ],
  },
  cta: {
    title: 'Ready to build a better workplace?',
    description:
      'Create your organization, add your employees and launch your first survey to better understand your teams.',
    primary: 'Get started with WellMind',
    secondary: 'Log in',
  },
  footer: {
    description: 'The platform that helps organizations listen to their employees and improve workplace well-being.',
    product: 'Product',
    access: 'Access',
    login: 'Log in',
    register: 'Create an organization',
    rights: 'All rights reserved.',
    productNav: 'Links to page sections',
    accessNav: 'Login and sign-up links',
  },
};

export const dictionaries: Record<Lang, Dictionary> = { fr, en };