import mongoose from 'mongoose';

// ---------------------------------------------------------------
// AiAnalysis = résultat d'une analyse IA des commentaires d'un sondage.
// Contient le résumé, les thèmes trouvés et les recommandations.
// Ne contient AUCUN identifiant d'employé.
// ---------------------------------------------------------------

export const ANALYSIS_STATUSES = ['PENDING', 'DONE', 'FAILED'];
export const THEME_SENTIMENTS = ['CONCERN', 'POSITIVE', 'MIXED'];
export const RECOMMENDATION_STATUSES = ['PROPOSED', 'ACCEPTED', 'REJECTED'];

// ---------- Recommandation (imbriquée dans un thème) ----------
const recommendationSchema = new mongoose.Schema(
  {
    // Texte proposé par l'IA, modifiable par le RH
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Explique le lien entre la recommandation et les retours observés
    rationale: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },

    status: {
      type: String,
      enum: RECOMMENDATION_STATUSES,
      default: 'PROPOSED',
    },

    // true si le RH a modifié le texte de l'IA
    editedByHr: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Action créée à partir de cette recommandation (si acceptée)
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImprovementAction',
      default: null,
    },
  },
  { _id: true }
);

// ---------- Thème (imbriqué dans l'analyse) ----------
const themeSchema = new mongoose.Schema(
  {
    // ex : "Organisation de la charge de travail"
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    sentiment: {
      type: String,
      enum: THEME_SENTIMENTS,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // Nombre de commentaires liés à ce thème.
    // Calculé par le BACKEND (pas par l'IA) en comptant les indices renvoyés.
    mentionCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Extraits désidentifiés et vérifiés avant affichage (3 maximum)
    excerpts: {
      type: [{ type: String, trim: true, maxlength: 500 }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: '3 extraits maximum par thème',
      },
    },

    recommendations: {
      type: [recommendationSchema],
      default: [],
    },
  },
  { _id: true }
);
// ---------- Statistiques des questions ----------
const questionStatisticSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    questionType: {
      type: String,
      required: true,
    },

    responseCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    average: {
      type: Number,
      default: null,
    },

    distribution: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false }
);
// ---------- Analyse ----------
const aiAnalysisSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },

    // Le RH qui a demandé l'analyse
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ANALYSIS_STATUSES,
      default: 'PENDING',
    },

    // Résumé neutre généré par l'IA
    summary: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    // Données calculées par le backend au moment de l'analyse
    // (jamais inventées par l'IA)
    responseCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    commentCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    statistics: {
     type: [questionStatisticSchema],
     default: [],
       },
       aiGenerated: {
       type: Boolean,
       default: false,
       },

    // true si trop peu de commentaires : l'IA ne tire pas de conclusions
    insufficientData: {
      type: Boolean,
      default: false,
    },

    // Limites signalées par l'IA (ex : "peu de commentaires sur la reconnaissance")
    limitations: {
      type: [String],
      default: [],
    },

    themes: {
      type: [themeSchema],
      default: [],
    },

    // Modèle utilisé, utile pour la soutenance (ex : "llama-3.1-8b via Groq")
    // Nommé aiModel et pas "model" : "model" est déjà une méthode des documents Mongoose
    aiModel: {
      type: String,
      trim: true,
      default: null,
    },

    // Message d'erreur technique si status = FAILED (jamais de contenu de réponse)
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Dernières analyses d'un sondage
aiAnalysisSchema.index({ organizationId: 1, surveyId: 1, createdAt: -1 });

// Cohérence du statut
aiAnalysisSchema.pre('validate', function () {
  if (this.status === 'FAILED' && !this.errorMessage) {
    this.errorMessage = "L'analyse IA a échoué";
  }
  if (this.status !== 'PENDING' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.insufficientData) {
    // Pas de recommandations sans éléments suffisants
    this.themes.forEach((t) => {
      t.recommendations = [];
    });
  }
});

// ---------- Méthodes ----------

// Retrouver une recommandation par son id, dans tous les thèmes
aiAnalysisSchema.methods.findRecommendation = function (recommendationId) {
  for (const theme of this.themes) {
    const rec = theme.recommendations.id(recommendationId);
    if (rec) return { theme, recommendation: rec };
  }
  return null;
};

// Thèmes séparés : préoccupations et points positifs (pour le tableau de bord)
aiAnalysisSchema.methods.splitThemes = function () {
  return {
    concerns: this.themes.filter((t) => t.sentiment === 'CONCERN'),
    positives: this.themes.filter((t) => t.sentiment === 'POSITIVE'),
    mixed: this.themes.filter((t) => t.sentiment === 'MIXED'),
  };
};

// Dernière analyse terminée d'un sondage
aiAnalysisSchema.statics.latestForSurvey = function (surveyId) {
  return this.findOne({ surveyId, status: 'DONE' }).sort({ createdAt: -1 });
};

const AiAnalysis = mongoose.model('AiAnalysis', aiAnalysisSchema);
export default AiAnalysis;