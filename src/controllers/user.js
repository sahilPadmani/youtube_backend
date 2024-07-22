import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
   const {userName,email,fullName,password} = req.body;

   if([userName,email,fullName,password].some((field)=>field?.trim() === "")){
        throw new ApiError(400,"All Field must be fill");
    }

    const existedUser = await User.findOne({
        $or : [ {userName}, {email}]
    });

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

   const avatarLocalPath =  req.files?.avatar[0]?.path;
   const coverLoacalPath = req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Not Found");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverLoacalPath);

   if(!avatar){
        throw new ApiError(400,"Avatar Not Found");
   }

   const user =  await User.create({
        fullName:fullName,
        avatar:avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase(),
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