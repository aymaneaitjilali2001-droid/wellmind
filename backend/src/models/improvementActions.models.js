import mongoose from 'mongoose';

// ---------------------------------------------------------------
// ImprovementAction = action concrète décidée par les RH pour
// améliorer les conditions de travail (créée à la main ou à partir
// d'une recommandation de l'IA), avec responsable, échéance et suivi.
// Elle vise une pratique de l'organisation, jamais un employé.
// ---------------------------------------------------------------

export const ACTION_STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

// Transitions de statut autorisées
export const ALLOWED_TRANSITIONS = {
  PLANNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED', 'PLANNED'],
  DONE: ['IN_PROGRESS'], // réouverture possible
  CANCELLED: ['PLANNED'], // reprise possible
};

// ---------- Note de suivi (imbriquée) ----------
const updateSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },

    // Rempli automatiquement quand le statut change
    statusFrom: { type: String, enum: [...ACTION_STATUSES, null], default: null },
    statusTo: { type: String, enum: [...ACTION_STATUSES, null], default: null },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ---------- Action d'amélioration ----------
const improvementActionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    // Le RH qui a créé l'action
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ex : "Mettre en place des réunions hebdomadaires sur les priorités"
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    // Objectif visé par l'action
    objective: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // Thème de travail concerné (ex : "Charge de travail"), utile même sans IA
    topic: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },

    // ---- Origine de l'action (tous facultatifs : création manuelle possible) ----
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      default: null,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiAnalysis',
      default: null,
    },
    themeId: {
      type: mongoose.Schema.Types.ObjectId, // _id du thème dans aiAnalyses.themes
      default: null,
    },
    recommendationId: {
      type: mongoose.Schema.Types.ObjectId, // _id de la recommandation
      default: null,
    },

    // Personne responsable de l'action
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ACTION_STATUSES,
      default: 'PLANNED',
    },

    // Partagée avec les employés (titre, objectif, statut seulement)
    visibleToEmployees: {
      type: Boolean,
      default: false,
    },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    updates: {
      type: [updateSchema],
      default: [],
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

// Liste des actions d'une organisation par statut et échéance
improvementActionSchema.index({ organizationId: 1, status: 1, targetDate: 1 });
// Actions d'un responsable
improvementActionSchema.index({ organizationId: 1, ownerId: 1 });
// Actions liées à un sondage (suivi des résultats)
improvementActionSchema.index({ organizationId: 1, surveyId: 1 });

// Une recommandation de l'IA ne peut devenir qu'une seule action
improvementActionSchema.index(
  { recommendationId: 1 },
  { unique: true, partialFilterExpression: { recommendationId: { $type: 'objectId' } } }
);

// Dates automatiques selon le statut
improvementActionSchema.pre('validate', function () {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'IN_PROGRESS' && !this.startedAt) this.startedAt = now;
    if (this.status === 'DONE') this.completedAt = now;
    if (this.status === 'CANCELLED') this.cancelledAt = now;
    if (this.status === 'PLANNED' || this.status === 'IN_PROGRESS') {
      this.completedAt = null;
      this.cancelledAt = null;
    }
  }
});

// ---------- Méthodes ----------

// Change le statut en respectant les transitions, et ajoute une note de suivi
improvementActionSchema.methods.changeStatus = function (newStatus, authorId, note = '') {
  const allowed = ALLOWED_TRANSITIONS[this.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transition impossible : ${this.status} → ${newStatus}`);
  }
  this.updates.push({
    authorId,
    note: note || `Statut changé : ${this.status} → ${newStatus}`,
    statusFrom: this.status,
    statusTo: newStatus,
  });
  this.status = newStatus;
  return this;
};

// Ajoute une note de suivi sans changer le statut
improvementActionSchema.methods.addUpdate = function (authorId, note) {
  this.updates.push({ authorId, note });
  return this;
};

// En retard : échéance passée et action pas terminée
improvementActionSchema.methods.isOverdue = function (now = new Date()) {
  return ['PLANNED', 'IN_PROGRESS'].includes(this.status) && this.targetDate < now;
};

// Version publique pour les employés : pas de notes internes ni de liens RH
improvementActionSchema.methods.toEmployeeView = function () {
  return {
    _id: this._id,
    title: this.title,
    objective: this.objective,
    topic: this.topic,
    status: this.status,
    targetDate: this.targetDate,
    completedAt: this.completedAt,
  };
};

// Actions visibles par les employés d'une organisation
improvementActionSchema.statics.findVisibleForEmployees = function (organizationId) {
  return this.find({
    organizationId,
    visibleToEmployees: true,
    status: { $ne: 'CANCELLED' },
  }).sort({ targetDate: 1 });
};

const ImprovementAction = mongoose.model('ImprovementAction', improvementActionSchema);
export default ImprovementAction;