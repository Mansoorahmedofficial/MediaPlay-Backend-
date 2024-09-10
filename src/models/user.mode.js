import mongo, { Schema } from "mongoose"
import bcr from "bcryptjs"

import jwt from "jsonwebtoken"

const UserSchema = new  mongo.Schema({
   username:{
    type:String, 
    require:true, 
    unique:true,
    lowercase:true,
    index:true,
   },
   email:{
    type:String, 
    require:true, 
    unique:true,
    lowercase:true,
   },
   fullname:{
    type:String, 
    require:true,
    index:true,
   },
   avatar:{
    type:String, //clouldinary server
    require:true,
   }, 
   coverimage:{
    type:String
   },
   watchHistory:[{
    type:Schema.Types.ObjectId, 
    ref:"video"
   }],
   password:{
    type:String,
    require:[true, "password is required"], 
   },
   refreshToken:{
    type:String,
   },
}, 
{timestamps:true}

)
UserSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
  this.password = await bcr.hash(this.password, 10)
  next()
})
UserSchema.methods.isPasswordCorrect = async function(password){
  return await bcr.compare(password, this.password)
}
UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email:this.email, 
            username: this.username, 
            fullname: this.fullname, 

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.generateRefreshToken =function (){
    return jwt.sign(
        {
            _id: this._id, 
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
} 
export const User = new mongo.model("User",UserSchema)