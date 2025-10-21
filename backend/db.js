import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
// Enable mongoose debug mode to log queries (helpful in development)
mongoose.set('debug', true);
const connection=()=>{
    mongoose.connect(process.env.MONGO_URI,{
         dbName: 'Duman',
    }).then(()=>{
        console.log("Database connected");
    }).catch((err)=>{
        console.log(`Database connection error: ${err}`);
    })
}

export default connection;