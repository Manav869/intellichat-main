import express from "express";
import connectToDatabase from "./src/config/database.js";
import { port } from "./src/config/constants.js";
import app from "./app.js";

import dotenv from "dotenv";
dotenv.config({path:"./.env"});

connectToDatabase().then(()=>{ 
    app.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
    });
}).catch((error)=>{
    console.log("Error connecting to database",error);
    process.exit(1);
});