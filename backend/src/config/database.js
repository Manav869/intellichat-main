import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';

const connectToDatabase = async () => {
    try{
        const connInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB successfully");
        return connInstance;
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}
export default connectToDatabase;