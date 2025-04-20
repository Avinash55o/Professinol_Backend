import {asyncHandler} from "../utils/asyncHandler.js"
import  {apiErrors} from "../utils/apiErrors.js"
import { User } from "../models/user.models.js";
import { UploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser= asyncHandler(async(req,res)=>{
    const {fullName, email, userName, password}= req.body
    console.log("email",email);
    if (
        [fullName, email, userName, password].some((field)=> field?.trim()=== "")
    ) {
        throw new apiErrors(400, "all fields are required")
    }
   // We can do this so we can find if it exist or not .. u can also check multiple
    // User.findOne({userName})
    const existedUser=await User.findOne(
        {
            $or:[{userName},{email}]
        }
    )

    if (existedUser) {
        throw new apiErrors(409, "userName or eamil already exist")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiErrors(400, "avatar is required")
    }

    const avatar=await UploadToCloudinary(avatarLocalPath);
    const coverImage= await UploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new apiErrors(400, "avatar is required")
    }

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        userName,
        password,
        email
    })

   const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiErrors(500, "somthing went wrong while creating the user")
    }

    return res.status(2001).json(
        new apiResponse(200, createdUser, "user registered")
    )
}) 

export {registerUser}