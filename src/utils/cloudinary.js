import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const UploadToCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //file upload successfull
        // console.log("file is uploaded to the cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response; 
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {UploadToCloudinary};