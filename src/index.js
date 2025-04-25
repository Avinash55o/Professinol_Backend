import dotenv from 'dotenv';
dotenv.config();
import { app } from './app.js';
import connectDB from "./db/index.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`your app is listening in ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("Database is not connected", error)
})