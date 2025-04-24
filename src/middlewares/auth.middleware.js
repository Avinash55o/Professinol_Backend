import { apiErrors } from "../utils/apiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";
import { jwt } from "jsonwebtoken";

export const verifyJWT= asyncHandler( async(req, res, next)=>{
    try {
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("bearer","")
    
        if (!token) {
            throw new apiErrors(401, "unauthorized login")
        }
        const decodedToken=jwt(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new apiErrors(401, "invalid access token")
        }
    
        req.user= user;
        next();
    } catch (error) {
        throw new apiErrors(401, error?.message || "invalid access token")
    }
})