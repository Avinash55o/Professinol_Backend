import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.models.js";
import { UploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // time issue in this to fix i put a debug
  // Add debugging to see what's the result
  console.log("Request body:", req.body);
  
  const { fullName, email, userName, password } = req.body || {};
  
//   console.log("email", email);
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new apiErrors(400, "all fields are required");
  }
  // We can do this so we can find if it exist or not .. u can also check multiple
  // User.findOne({userName})
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new apiErrors(409, "userName or eamil already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
// const coverImageLocalPath = req.files?.coverImage[0]?.path;
// classic js code to solve the TypeError: Cannot read properties of undefined

let coverImageLocalPath;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0) {
    coverImageLocalPath=req.files.coverImage[0].path
};

  if (!avatarLocalPath) {
    throw new apiErrors(400, "avatar is required");
  }

  const avatar = await UploadToCloudinary(avatarLocalPath);
  const coverImage = await UploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiErrors(400, "avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName,
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiErrors(500, "somthing went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered"));
});


const loginUser= asyncHandler( async(req, res)=>{
  console.log("request.body",req.body)
  const {email, userName, password}=req.body;

  if (!userName || !email) {
    throw new apiErrors(400, "username or email is required")
  };
  
  // find with userName or email
  const user =await User.findOne({
    $or:[{userName},{email}]
  });
  // now need to check
  if (!user) {
    throw new apiErrors(404,"There is no user with this username or email")
  }
  
  // we had created a method for this
 const isPasswordValid= await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiErrors(401,"password incorrect")
  }


})

export { registerUser };
