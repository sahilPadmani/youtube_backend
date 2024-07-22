import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configure Cloudinary with environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - The local path to the file to be uploaded
 * @returns {Promise<Object|null>} The response from Cloudinary or null if an error occurred
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' });

        return response;

    } catch (error) {

        return null;
        
    }finally{
        fs.unlinkSync(localFilePath);
    }
};

export { uploadOnCloudinary };
