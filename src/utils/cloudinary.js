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
        // Check if the local file path is provided
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' });

        // Log the URL of the uploaded file
        console.log('File uploaded to Cloudinary:', response.url);

        return response;
    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error uploading file to Cloudinary:', error);

        // Delete the local file if an error occurred during the upload
        fs.unlinkSync(localFilePath);

        return null;
    }
};

export { uploadOnCloudinary };
