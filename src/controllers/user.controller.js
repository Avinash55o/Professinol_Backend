import { asyncHandler } from "../utils/asyncHandler.js";
import { apiErrors } from "../utils/apiErrors.js";
import { User } from "../models/user.models.js";
import { UploadToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

// GENERATE ACCESS AND REFRESH TOKEN
const generateAccessAndRefressToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refressToken = user.generateRefreshToken();

    user.refressToken = refressToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refressToken };
  } catch (error) {
    throw new apiErrors(
      500,
      "something went rong in creating the access and refress token"
    );
  }
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

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

  // console.log("is avatar localpath is there",avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // classic js code to solve the TypeError: Cannot read properties of undefined

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiErrors(400, "avatar is required");
  }

  const avatar = await UploadToCloudinary(avatarLocalPath);

  // console.log("after upload to cloudinary",avatar);

  const coverImage = await UploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiErrors(400, "avatar_1 is required");
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

//login controller
const loginUser = asyncHandler(async (req, res) => {
  console.log("request body:", req.body);

  let { email, userName, password } = req.body;

  if (!(userName || email)) {
    throw new apiErrors(400, "username or email is required");
  }

  // find with userName or email
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  // now need to check
  if (!user) {
    throw new apiErrors(404, "There is no user with this username or email");
  }
  // console.log("Retrieved user:", user);
  // console.log("Is user instance of User:", user instanceof User);

  // we had created a method for this
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiErrors(401, "password incorrect");
  }

  const { accessToken, refressToken } = await generateAccessAndRefressToken(
    user._id
  );
  console.log(accessToken);
  console.log(refressToken);

  const loggedinUser = await User.findById(user._id).select(
    "-password -refressToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refressToken", refressToken, option)
    .json(
      new apiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refressToken,
        },
        "user is loggedin"
      )
    );
});

// LOGOUT CONTROLLER
const logOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearcookie("accessToken", option)
    .clearcookie("refressToken", option)
    .json({ message: "user logged out successfully" });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookie.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new apiErrors(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiErrors(401, "invalid refresh token");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new apiErrors(401, "refresh token is expired or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefressToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken, newRefreshToken },
          "al done refreshed"
        )
      );
  } catch (error) {
    throw new apiErrors(401, error?.message || "invalid refresh token");
  }
});

// change the current pass
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const ispasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!ispasswordCorrect) {
    throw new apiErrors(400, "invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(
    new apiErrors(
      200,
      {
        newPassword: newPassword,
        oldPassword: oldPassword,
      },
      "your password has been change"
    )
  );
});

// get the user
const getCurrentUser = asyncHandler(async (res, req) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "current user fetched successfully"));
});

// UPDATE THE ACCOUNT DETAIL
const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new apiErrors(400, "fullname or email required");
  }

  User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res.status(200).json(new apiResponse(200, "fields are updated"));
});

// UPDATE AVATAR IMAGE
const UpdateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;

  if (avatarLocalPath) {
    throw new apiErrors(400, "avatar file is missing");
  }

  const avatar = await UploadToCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new apiErrors(400, "error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "avatar image uploaded successfully"));
});

// SAME FOR THE COVER IMAGE
const UpdateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.path;

  if (!coverImageLocalPath) {
    throw new apiErrors(400, "avatar file is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "cover image uploaded successfully"));
});

export {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetail,
  UpdateUserAvatar,
  UpdateCoverImage,
};
