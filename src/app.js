import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
const app = express()


app.use(cors({
    origin:process.env.CORS,
    credentials:true,
}))
app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static("public/tmp"))
app.use(cookieParser())

//routes 
import UserRoute from "./routers/user.rout.js"
import path from "path";

app.use("/api/v1/users", UserRoute)


export {app}