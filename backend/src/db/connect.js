import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToMongoDB = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'chapitre',
});
console.log(`Connexion à MongoDB réussie ✅ (base : ${mongoose.connection.name})`);
    } catch (error) {
        console.error('Erreur de connexion à MongoDB ❌');
        console.error(error.message);

        process.exit(1);
    }
};

export default connectToMongoDB;