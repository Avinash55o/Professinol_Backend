import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new mongoose.Schema({
    videoFile:{
        type: String,
        required: true,
        unique:true,
    },
    thumbnail:{
        type: String,
        required:true,
        unique:true,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type:String,
        unique:true,
        required: [true,"Title is required"]
    },
    description:{
        type: String,
        required:true
    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
    },
    ispublished:{
        type: Boolean,
        default:true
    }
},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate)
export const Video= mongoose.model("Video", videoSchema)