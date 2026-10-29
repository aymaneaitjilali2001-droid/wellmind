import mongoose from 'mongoose';

export const USER_ROLES = ['HR_ADMIN', 'EMPLOYEE'];

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Adresse e-mail invalide'],
    },

    // select: false : le hash n'est jamais renvoyé par défaut dans les requêtes.
    // Pour le login : User.findOne({ email }).select('+passwordHash')
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      default: 'EMPLOYEE',
      required: true,
    },

    // Groupe large utilisé pour les statistiques (seuil de 5 réponses)
    department: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    // Désactiver plutôt que supprimer : on garde l'historique des participations
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Accélère la liste des employés d'une organisation filtrée par rôle
userSchema.index({ organizationId: 1, role: 1 });

const User = mongoose.model('User', userSchema);
export default User;