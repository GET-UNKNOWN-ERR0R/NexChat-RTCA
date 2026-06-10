import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

let isConfigured = false;

const configureCloudinary = () => {
    if (isConfigured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env"
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    isConfigured = true;
};

export const uploadToCloudinary = (
    fileBuffer,
    folder,
    resourceType = "image"
) => {
    configureCloudinary();

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `nexchat/${folder}`,
                resource_type: resourceType,
                timeout: 120000,
                ...(resourceType === "video"
                    ? { chunk_size: 6000000 }
                    : {}),
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );

        streamifier
            .createReadStream(fileBuffer)
            .pipe(uploadStream);
    });
};

const getPublicIdFromUrl = (url) => {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    const pathAfterUpload = url
        .slice(uploadIndex + "/upload/".length)
        .replace(/^v\d+\//, "");

    return pathAfterUpload.replace(/\.[^/.]+$/, "");
};

export const deleteFromCloudinary = async (
    url,
    resourceType = "image"
) => {
    if (!url?.includes("cloudinary.com")) return;

    configureCloudinary();

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
    }
};

export default cloudinary;
