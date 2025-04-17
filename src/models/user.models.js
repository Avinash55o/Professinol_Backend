import mongoose from "mongoose";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

const userSchema= new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        lowercase: true,
        trim:true,
        index:true, // use index so it become easily seachable (optimise way)
        unique:true
    },
    watchHistory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    email:{
        type:String,
        required:true,
        lowercase: true,
        trim:true,
        unique:true
    },
    fullName:{
        type:String,
        required:true,
        index: true
    },
    avatar:{
        type:String,
    },
    coverImage:{
        type:String,
    },
    password:{
        type: String,
        required:true,
        minLength:[8,"Password must be of 8 characters"]
    },
    refreshToken:{
        type: String,

    }



},{timestamps:true});


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next;
    this.password=bcrypt.hash(this.password, 10)
    next
})

userSchema.method.isPasswordCorrect= async function (password) {
    return await bcrypt.compare(password, this.password)
}
export const User= mongoose.model("User", userSchema);