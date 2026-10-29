import mongoose from 'mongoose';

export const SURVEY_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED'];
export const QUESTION_TYPES = ['RATING', 'CHOICE', 'TEXT'];

// ---------- Option d'une question à choix multiple ----------
const optionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// ---------- Question (imbriquée dans le sondage) ----------
const questionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
    },

    isRequired: {
      type: Boolean,
      default: false,
    },

    // Ordre d'affichage dans le sondage
    position: {
      type: Number,
      required: true,
      min: 0,
    },

    // Seulement pour RATING (ex : 1 à 5)
    scaleMin: { type: Number },
    scaleMax: { type: Number },
    minLabel: { type: String, trim: true, maxlength: 50 }, // ex : "Pas du tout satisfait"
    maxLabel: { type: String, trim: true, maxlength: 50 }, // ex : "Très satisfait"

    // Seulement pour CHOICE
    options: {
      type: [optionSchema],
      default: [],
    },
  },
  { _id: true } // chaque question a son _id, utilisé par responses.answers.questionId
);

// Vérifie la cohérence de chaque question selon son type.
// Hook sans `next` : on lance une erreur avec `throw`.
// Fonctionne avec Mongoose 8 et Mongoose 9 (qui a supprimé `next` dans les pre hooks).
questionSchema.pre('validate', function () {
  if (this.type === 'RATING') {
    if (this.scaleMin == null) this.scaleMin = 1;
    if (this.scaleMax == null) this.scaleMax = 5;
    if (this.scaleMin >= this.scaleMax) {
      throw new Error(`Question "${this.label}" : scaleMin doit être inférieur à scaleMax`);
    }
    if (this.scaleMax - this.scaleMin > 10) {
      throw new Error(`Question "${this.label}" : l'échelle ne doit pas dépasser 10 points`);
    }
    this.options = [];
  }

  if (this.type === 'CHOICE') {
    if (!this.options || this.options.length < 2) {
      throw new Error(`Question "${this.label}" : au moins 2 options sont nécessaires`);
    }
    this.scaleMin = undefined;
    this.scaleMax = undefined;
  }

  if (this.type === 'TEXT') {
    this.options = [];
    this.scaleMin = undefined;
    this.scaleMax = undefined;
  }
});

// ---------- Sondage ----------
const surveySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Le RH qui a créé le sondage
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // true = réponses anonymes (responses.userId sera null)
    isAnonymous: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: SURVEY_STATUSES,
      default: 'DRAFT',
      index: true,
    },

    // Période de disponibilité
    startDate: { type: Date },
    endDate: { type: Date },

    // Sondages récurrents : même seriesId pour tous les sondages d'une série
    // (ex : questionnaire mensuel), utile pour comparer les périodes
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // Thème principal (charge de travail, communication, etc.)
    topic: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
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

// Liste rapide des sondages d'une organisation par statut
surveySchema.index({ organizationId: 1, status: 1, createdAt: -1 });

// Vérifie la cohérence des dates
surveySchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    throw new Error('La date de fin doit être après la date de début');
  }
});

// ---------- Méthodes utiles dans les contrôleurs ----------

// Les questions et le mode anonyme ne sont modifiables qu'en brouillon
surveySchema.methods.isEditable = function () {
  return this.status === 'DRAFT';
};

// Le sondage accepte-t-il des réponses maintenant ?
surveySchema.methods.isOpen = function (now = new Date()) {
  if (this.status !== 'PUBLISHED') return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
};

// Conditions minimales pour publier ; renvoie la liste des erreurs
surveySchema.methods.getPublishErrors = function () {
  const errors = [];
  if (this.status !== 'DRAFT') errors.push('Seul un brouillon peut être publié');
  if (!this.title) errors.push('Le titre est obligatoire');
  if (!this.questions || this.questions.length === 0) errors.push('Ajoutez au moins une question');
  if (!this.startDate || !this.endDate) errors.push('Les dates de début et de fin sont obligatoires');
  if (this.endDate && this.endDate <= new Date()) errors.push('La date de fin est déjà passée');
  return errors;
};

// Retourne les questions triées par position
surveySchema.methods.getSortedQuestions = function () {
  return [...this.questions].sort((a, b) => a.position - b.position);
};

const Survey = mongoose.model('Survey', surveySchema);
export default Survey;