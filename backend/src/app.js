import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
 
const app = express();
 
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '100kb' }));
 
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