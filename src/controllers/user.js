import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
   const {username,email,fullname,password} = req.body;

   if([username,email,fullname,password].some((field)=>field?.trim() === "")){
        throw new ApiError(400,"All Field must be fill");
    }

    const existedUser = User.findOne({
        $or : [ {username}, {email}]
    });

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

   const avatarLocalPath =  req.files?.avatar[0]?.path;
   const coverLoacalPath = req.files?.coverImage[0]?.path;


   if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Not Found");
   }
   const register_avatar = await uploadOnCloudinary(avatarLocalPath);
   const register_coverImage = await uploadOnCloudinary(coverLoacalPath);

   if(!avatar){
        throw new ApiError(400,"Avatar Not Found");
   }

   const user = User.create({
        fullName:fullname,
        avatar:register_avatar.url,
        coverImage : register_coverImage?.url || "",
        email,
        password,
        userName:username.toLowerCase(),
   });

    const createduser = await User.findById(user._id).select("-password -refreshToken");

    if(!createduser){
        throw new ApiError(500 , "Something went wrong while registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200,createduser,"User Succesfully registerd")
    );
});

export {registerUser};