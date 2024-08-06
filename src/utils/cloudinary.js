import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configure Cloudinary with environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const deleteOnCloudinary = async(CloudinaryFilePath)=>{
    try {
        if(!CloudinaryFilePath) return null;

        const response = await cloudinary.uploader.destroy(CloudinaryFilePath);

        if (response.result === 'not found') {
            return null;
        }

        return response;
        
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary , deleteOnCloudinary};
