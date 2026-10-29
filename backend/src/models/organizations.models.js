import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    // Identifiant lisible et unique, utile pour les URLs ou l'affichage
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets'],
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    // Taille approximative de l'entreprise (information de base)
    size: {
      type: Number,
      min: 1,
    },

    // Seuil de confidentialité : résultats détaillés et analyse IA
    // affichés seulement à partir de ce nombre de réponses (défaut 5)
    minResponseThreshold: {
      type: Number,
      default: 5,
      min: 3,
      max: 50,
    },

    // Liste des services, pour garder des noms cohérents dans users.department
    departments: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
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

// Génère le slug à partir du nom s'il n'est pas fourni
organizationSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;