// Erreur avec un code HTTP, transformée en réponse JSON par errorHandler.
// Exemple : throw new HttpError(404, 'Sondage introuvable');
export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
 
export default HttpError;
 