import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return new Error("Could not find the given path!");
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary ", response.url);
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return new Error("Could not find the given public id");
        // delete file from the cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });
        // file has been deleted successfully
        // console.log("file is deleted from cloudinary ---> ", response);
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
