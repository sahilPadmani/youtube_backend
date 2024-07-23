import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { request } from "express";
import jwt from "jsonwebtoken";

const CookiesOptions = function () {
    this.httpOnly = true,
        this.secure = true;
}

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };

    } catch (error) {
        throw new ApiError(500, "Error while generating AccessToken And RefreshToken");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, fullName, password } = req.body;

    if ([userName, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Field must be fill");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //    const coverLoacalPath = req.files?.coverImage[0]?.path;
    let coverLoacalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLoacalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Not Found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLoacalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar Not Found");
    }

    const user = await User.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    const createduser = await User.findById(user._id).select("-password -refreshToken");

    if (!createduser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User Succesfully registerd")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, userName } = req.body;

    if (!email && !userName) {
        throw new ApiError(400, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { userName }]
    });

    if (!user) {
        throw new ApiError(404, "user not exist");
    }

    const isPasswordVaild = await user.isPasswordCorrect(password);

    if (!isPasswordVaild) {
        throw new ApiError(401, "password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = new CookiesOptions();

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "User Logged In Successfully"
        ));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    });

    const options = new CookiesOptions();

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefresToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefresToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefresToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invaild refresh token");
        }

        if (incomingRefresToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token Is Expired or used")
        }

        const options = new CookiesOptions();

        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200,
                {
                    refreshToken, accessToken
                },
                "Access Token Refresh Successfully"
            ));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invaild refresh token");
    }

});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};