import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n mongoDB is connected !! DB host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("error in connect to database",error)
        process.exit(1)
    }
}

export default connectDB