
import { HttpError } from '../utils/Httperror.js';

const requireRole = (...allowedRoles) => (req, _res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
        return next(new HttpError(401, 'Authentification requise'));
    }

    // Vérifier si l'utilisateur possède un rôle autorisé
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        return next(
            new HttpError(
                403,
                "Vous n'avez pas la permission d'effectuer cette action."
            )
        );
    }

    next();
};

export default requireRole;
