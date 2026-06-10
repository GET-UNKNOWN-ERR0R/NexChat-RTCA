import multer from "multer";

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});

export default memoryUpload;
