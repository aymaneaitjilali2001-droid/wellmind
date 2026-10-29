import mongoose from 'mongoose';

// ---------------------------------------------------------------
// Participation = "QUI a répondu" à un sondage.
// Ne contient AUCUNE réponse : le contenu est dans la collection
// `responses`, sans lien avec ce document (anonymat).
// ---------------------------------------------------------------

// Garde seulement le jour (00:00 UTC) : pas d'heure exacte,
// pour empêcher de relier une participation à une réponse par l'heure.
export const toDayOnly = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const participationSchema = new mongoose.Schema(
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

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Jour de l'envoi seulement (voir toDayOnly)
    submittedOn: {
      type: Date,
      required: true,
      default: () => toDayOnly(),
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

// Un employé ne peut participer qu'une seule fois à un sondage.
// Un 2e envoi provoque une erreur MongoDB code 11000 → renvoyer 409.
participationSchema.index({ surveyId: 1, userId: 1 }, { unique: true });

// Compter rapidement les participants d'un sondage
participationSchema.index({ organizationId: 1, surveyId: 1 });

// Arrondit toujours la date au jour, même si une heure est fournie
participationSchema.pre('validate', function () {
  if (this.submittedOn) this.submittedOn = toDayOnly(this.submittedOn);
});

// ---------- Méthodes statiques utiles dans les contrôleurs ----------

// L'employé a-t-il déjà répondu ?
participationSchema.statics.hasParticipated = async function (surveyId, userId) {
  const found = await this.exists({ surveyId, userId });
  return Boolean(found);
};

// Nombre de participants d'un sondage
participationSchema.statics.countForSurvey = function (surveyId) {
  return this.countDocuments({ surveyId });
};

// Ids des sondages auxquels l'employé a déjà répondu (pour alreadySubmitted)
participationSchema.statics.surveyIdsForUser = async function (userId) {
  const rows = await this.find({ userId }).select('surveyId').lean();
  return rows.map((r) => r.surveyId.toString());
};

const Participation = mongoose.model('Participation', participationSchema);
export default Participation;