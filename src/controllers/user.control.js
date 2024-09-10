import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import mongo from "mongoose";
import { User } from "../models/user.mode.js";
import { uploadCloudinary } from "../utils/cloudniry.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
import { options } from "../utils/options.js";

const AcessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken(); // accessToken is already generated in db
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating user token !!"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "ok" });
  // get user details  from frontend
  // validations - not empty
  // check if user already exits: username, email
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullname, email, username, password } = req.body;
  console.log(fullname, email, username, password);

  //   if(fullname === ""){
  //  throw new ApiError(400, "fullname is required")
  //   }
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }
  const UserExited = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (UserExited) {
    throw new ApiError(409, "User with email or username already exist");
  }
  // console.log(req.files);
  // const AvatarLocalPath = req.files?.avatar[0]?.path;
  let AvatarLocalPath;
  if (
    req.files &&
    req.file.avatar &&
    Array.isArray(req.file.avatar) &&
    req.file.avatar.length > 0
  ) {
    AvatarLocalPath = req.file.avatar[0].path;
  } else {
    // AvatarLocalPath = undefined;
  }

  // let AvatarLocalPath;
  // if(req.files && Array.isArray(req.files.avatar)&& req.files.avatar.length > 0){
  //   AvatarLocalPath = req.files.avatar[0].path
  // }
  // const CoverImageLocalPath = req.files?.coverImage[0]?.path;  // this is not required
  let CoverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    CoverImageLocalPath = req.files.coverImage[0].path;
  }

  // if (!AvatarLocalPath) {
  //    throw new ApiError(409, "avatar is required !")
  // }
  const avatar = await uploadCloudinary(AvatarLocalPath);
  const coverimage = await uploadCloudinary(CoverImageLocalPath);

  // if(!avatar){
  //     throw new ApiError(409, "avatar is required !")
  // }

  const user = User.create({
    fullname,
    avatar: avatar?.url,
    coverimage: coverimage?.url,
    email,
    password,
    username: username.toLowerCase(),
  });
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createduser) {
    throw new ApiError(500, "something went wrong ");
  }

  return res
    .status(201)
    .json(new Apiresponse(200, createduser, "created successfully "));
});

const UserLogin = asyncHandler(async (req, res) => {
  // fist check user details
  // second if yours details match with databases details
  // compare user password and database  password
  // both are match log say welcome
  // access and refresh tokens

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password required !");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "user doest not exitist !!");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalide user credentials");
  }
  const { accessToken, refreshToken } = await AcessAndRefreshTokens(user._id);
  const loggedInuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const opetion = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(201)
    .cookie("accessToken", accessToken, opetion)
    .cookie("refreshToken", refreshToken, opetion)
    .json(
      new Apiresponse(
        200,
        {
          user: loggedInuser,
          accessToken,
          refreshToken,
        },
        "user logged in Success Fully"
      )
    );
});
const UserLogOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const opetion = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", opetion)
    .clearCookie("refreshToken", opetion)
    .json(new ApiError(200, {}, "user logged out !!"));
});

const refreshAcesstoken = asyncHandler(async (req, res) => {
  const IncomingToken =
    req.cookies.refreshToken || req.body.cookies.refreshToken;
  if (!IncomingToken) {
    throw new ApiError(401, "unauthorized request !");
  }
  try {
    const decodedToken = jwt.verify(
      IncomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token !!");
    }
    if (IncomingToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used ");
    }
    const { accessToken, newrefreshToken } = await AcessAndRefreshTokens(
      user._id
    );
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new Apiresponse(
          201,
          { accessToken, refreshToken: newrefreshToken },
          "Access token is refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalide refresh token");
  }
});
const ChangeCurrentPassword = asyncHandler(async (req, res) => {
  const { OldPassword, Newpassword } = req.body;
  // const {OldPassword, Newpassword, ConfirmPassword} = req.body
  // if(!(Newpassword === ConfirmPassword)){   // example code for to add aanother feature
  //   throw new ApiError(401, "Check confirm password  !!")
  // }
  const user = await user.findById(req.user?._id);
  const IspasswordCorrect = await user.isPasswordCorrect(OldPassword);
  if (!IspasswordCorrect) {
    throw new ApiError(401, "Invalide password");
  }
  user.password = Newpassword;
  user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new Apiresponse(200, {}, "your password updated"));
});

const GetCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(n201, req.user, "current feteched successfully");
});

const UpdateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(401, "All fields are requried");
  }
  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new Apiresponse(201, User, "Accoun have been update"));
});
const UpdateUserAvatar = asyncHandler(async (req, res) => {
  const AvatarLocalPath = req.file?.path;
  if (!AvatarLocalPath) {
    throw new ApiError(401, "Avatar not found !!");
  }
  const Avatar = await uploadCloudinary(AvatarLocalPath);
  if (!Avatar.url) {
    throw new ApiError(400, "Error while uploading Avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: Avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(201)
    .json(new Apiresponse(201, user, "Avatar is successfully updated"));
});

const UpdateCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiError(400, "CoverImage required ");
  }
  const coverimage = await uploadCloudinary(CoverImageLocalPath);
  if (!coverimage.url) {
    throw new ApiError(400, "Error While Uploading CoverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(201)
    .json(new Apiresponse(201, user, "Coveriamge updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(401, "username is not missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    {
      $addFields: {
        subsscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribersCount: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          $cond: {
            // compare
            if: { $in: [req.user?._id, "$$subscribers:$subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subsscribersCount: 1,
        channelSubscribersCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverimage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exits");
  }
  return res
    .satus(201)
    .json(
      new Apiresponse(201, channel[0], "user channel fetched successfully !")
    );
});
const GetWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongo.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              $first: "$owner",
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(201)
    .json(
      new Apiresponse(
        201,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});
export {
  registerUser,
  UserLogin,
  UserLogOut,
  refreshAcesstoken,
  ChangeCurrentPassword,
  GetCurrentUser,
  UpdateUserDetails,
  UpdateUserAvatar,
  UpdateCoverImage,
  getUserChannelProfile,
  GetWatchHistory,
};
