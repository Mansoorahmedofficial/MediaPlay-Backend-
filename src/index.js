import dotenv from "dotenv"
import ConnectDb from "./db/index.con.js";

import { application } from "express";
import { app } from "./app.js";
dotenv.config({
    path:"./env"
})



ConnectDb()
.then(()=>{
    app.listen(process.env.PORT || 7001,()=>{
        console.log(`http://localhost:${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log('connections error');
})
