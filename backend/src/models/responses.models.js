import mongoose from 'mongoose';
import { toDayOnly } from './participations.models.js';

// ---------------------------------------------------------------
// Response = "CE QUI a été répondu" à un sondage.
// Pour un sondage anonyme, userId est null : aucun champ ne permet
// de relier cette réponse à un employé ni à sa participation.
// ---------------------------------------------------------------

// ---------- Réponse à une question (imbriquée) ----------
const answerSchema = new mongoose.Schema(
  {
    // _id de la question dans survey.questions
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Copie du type, pour les statistiques sans relire le sondage
    questionType: {
      type: String,
      enum: ['RATING', 'CHOICE', 'TEXT'],
      required: true,
    },

    // RATING : la note choisie (ex : 1 à 5)
    ratingValue: {
      type: Number,
      default: null,
    },

    // CHOICE : _id de l'option choisie
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // TEXT : commentaire original, jamais envoyé tel quel à l'IA ni affiché aux RH
    textValue: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
      select: false,
    },

    // TEXT : version désidentifiée (noms, e-mails, téléphones masqués)
    // C'est celle-ci qui est utilisée pour l'IA et les extraits
    textRedacted: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
  },
  { _id: false }
);

// Une seule valeur doit être remplie, selon le type de question
answerSchema.pre('validate', function () {
  if (this.questionType === 'RATING') {
    if (typeof this.ratingValue !== 'number') {
      throw new Error('Une note est attendue pour une question RATING');
    }
    this.optionId = null;
    this.textValue = null;
    this.textRedacted = null;
  }

  if (this.questionType === 'CHOICE') {
    if (!this.optionId) {
      throw new Error('Une option est attendue pour une question CHOICE');
    }
    this.ratingValue = null;
    this.textValue = null;
    this.textRedacted = null;
  }

  if (this.questionType === 'TEXT') {
    this.ratingValue = null;
    this.optionId = null;
  }
});

// ---------- Réponse complète à un sondage ----------
const responseSchema = new mongoose.Schema(
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

    // null si le sondage est anonyme
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Copie de survey.isAnonymous au moment de l'envoi
    isAnonymous: {
      type: Boolean,
      required: true,
    },

    // Groupe large pour les statistiques (soumis au seuil de 5 réponses)
    department: {
      type: String,
      trim: true,
      default: null,
    },

    // Jour seulement, sans l'heure
    submittedOn: {
      type: Date,
      required: true,
      default: () => toDayOnly(),
    },

    answers: {
      type: [answerSchema],
      default: [],
    },
  },
  {
    // Pas de createdAt / updatedAt : ils contiendraient l'heure exacte
    timestamps: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Statistiques d'un sondage, éventuellement par service
responseSchema.index({ organizationId: 1, surveyId: 1, department: 1 });

// Règles d'anonymat appliquées à chaque enregistrement
responseSchema.pre('validate', function () {
  if (this.isAnonymous && this.userId) {
    throw new Error('Une réponse anonyme ne doit pas contenir de userId');
  }
  if (!this.isAnonymous && !this.userId) {
    throw new Error('Une réponse identifiée doit contenir un userId');
  }
  if (this.submittedOn) this.submittedOn = toDayOnly(this.submittedOn);

  // Une seule réponse par question
  const ids = this.answers.map((a) => a.questionId.toString());
  if (new Set(ids).size !== ids.length) {
    throw new Error('Une question a reçu plusieurs réponses');
  }
});

// ---------- Méthodes statiques ----------

// Nombre de réponses d'un sondage (pour vérifier le seuil)
responseSchema.statics.countForSurvey = function (surveyId, filter = {}) {
  return this.countDocuments({ surveyId, ...filter });
};

// Commentaires désidentifiés d'un sondage, sans aucun identifiant (pour l'IA)
responseSchema.statics.getRedactedComments = async function (surveyId) {
  const rows = await this.aggregate([
    { $match: { surveyId: new mongoose.Types.ObjectId(String(surveyId)) } },
    { $unwind: '$answers' },
    {
      $match: {
        'answers.questionType': 'TEXT',
        'answers.textRedacted': { $nin: [null, ''] },
      },
    },
    { $project: { _id: 0, questionId: '$answers.questionId', text: '$answers.textRedacted' } },
  ]);
  return rows;
};

const Response = mongoose.model('Response', responseSchema);
export default Response;