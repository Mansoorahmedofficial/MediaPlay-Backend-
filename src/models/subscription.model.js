import mongo, { Schema } from "mongoose";
const UserSubscriptionSchema = new mongo.Schema({
  subscriber:{
    type: Schema.Types.ObjectId, 
    ref:"User"    
  }, 
  channel:{
    type:Schema.Types.ObjectId, 
    ref: "User"
  }

}, {timestamps:true})

const Subscription = new mongo.model("Subscription", UserSubscriptionSchema )
export default Subscription