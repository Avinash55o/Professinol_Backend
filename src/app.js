import express from 'express';
import cors from 'cors'

const app= express();

app.use(cors());

app.use(express.json({limit:"16kb"})); // use to read the json files
app.use(express.urlencoded({extended:true,limit:"16kb"})); // use to encode the url
app,use(express.static("public")); // useing public

export {app};