import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Un ObjectId normal contient l'heure exacte de sa création (à la seconde).
// Pour une réponse, cela permettrait de la relier à la participation créée
// à la même seconde, donc à l'employé.
// Cet id ne garde que le jour (00:00 UTC) ; les 8 autres octets sont aléatoires.
export const anonymousObjectId = (date = new Date()) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  const bytes = crypto.randomBytes(12);
  bytes.writeUInt32BE(Math.floor(day.getTime() / 1000), 0);
  return new mongoose.Types.ObjectId(bytes);
};

export default anonymousObjectId;