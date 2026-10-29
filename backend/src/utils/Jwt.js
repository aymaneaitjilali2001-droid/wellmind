
import jwt from 'jsonwebtoken';

// Vérifier que JWT_SECRET existe
const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET manquant dans le fichier .env');
  }

  return secret;
};

// Générer un token JWT
export const signToken = (user) => {
  if (!user?._id) {
    throw new Error("L'identifiant de l'utilisateur est manquant");
  }

  if (!user.organizationId) {
    throw new Error("L'organisation de l'utilisateur est manquante");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    },
    getSecret(),
    {
      subject: user._id.toString(),
      algorithm: 'HS256',
      expiresIn: '8h',
    }
  );
};

// Vérifier un token JWT
export const verifyToken = (token) => {
  if (!token) {
    throw new Error('Token manquant');
  }

  return jwt.verify(token, getSecret(), {
    algorithms: ['HS256'],
  });
};
