import mongo, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema({
   videofile:{
    type:String, 
    required:true, 
   },
   thumbnail:{
    type:String,
    required:true,
   },
   titlel:{
    type:String,
    required:true,
   },
   discribption:{
    type:String,
    required:true,
   },
   duration:{
    type:Number,
    required:true,
   },
   view:{
    type:Number, 
    default:0, 
   }, 
   inPublish:{
    type:Boolean, 
    default:true
   },
   owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
   }
},
{timestamps:true}

)
videoSchema.plugin(mongooseAggregatePaginate)
export const video = new mongo.model("videos",videoSchema)