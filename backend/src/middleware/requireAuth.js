
import User from '../models/User.models.js';
import { verifyToken } from '../utils/Jwt.js';
import { HttpError } from '../utils/Httperror.js';

const requireAuth = async (req, _res, next) => {
    try {
        // 1. Récupérer le token depuis le cookie
        const token = req.cookies?.wellmind_session;

        if (!token) {
            return next(new HttpError(401, 'Authentification requise'));
        }

        // 2. Vérifier le token JWT
        const decoded = verifyToken(token);

        // 3. Vérifier les informations du token
        if (!decoded?.userId) {
            return next(new HttpError(401, 'Token invalide'));
        }

        // 4. Récupérer l'utilisateur depuis MongoDB
        const user = await User.findById(decoded.userId)
            .select('_id organizationId firstName lastName email role isActive');

        if (!user || !user.isActive) {
            return next(new HttpError(401, 'Utilisateur introuvable ou désactivé'));
        }

        // 5. Ajouter l'utilisateur à la requête
        // Les contrôleurs lisent req.user.userId (chaîne) et req.user.organizationId
        req.user = {
            userId: user._id.toString(),
            organizationId: user.organizationId.toString(),
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        // 6. Passer au middleware suivant
        next();

    } catch (error) {
        // Erreurs liées au JWT
        if (
            error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError' ||
            error.name === 'NotBeforeError'
        ) {
            return next(new HttpError(401, 'Token invalide ou expiré'));
        }

        // Autres erreurs : MongoDB, serveur...
        next(error);
    }
};

export default requireAuth;



