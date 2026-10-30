/*Requête HTTP
    |
    v
CORS
    |
    v
express.json()  → Lit le JSON
    |
    v
cookieParser()  → Lit les cookies
    |
    v
Routes API      → /api/...
    |
    v
notFound        → Si aucune route ne correspond
    |
    v
errorHandler    → Gère les erreurs*/
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './db/connect.js';
import apiRoutes from './routes/Index.routes.js';
import { notFound, errorHandler } from './middleware/Errorhandler.js';
import cookieParser from 'cookie-parser';
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
// Express 5 laisse req.body à undefined quand la requête n'a pas de corps :
// les contrôleurs lisent req.body.xxx directement
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
app.use(cookieParser());

app.use('/api', apiRoutes);
 
// Toujours en dernier
app.use(notFound);
app.use(errorHandler);
 
const PORT = process.env.PORT || 4000;
 
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Connexion à MongoDB impossible :', err.message);
    process.exit(1);
  });
 
export default app;