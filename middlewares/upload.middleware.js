import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "image/jpeg",

  "image/png",

  "image/webp",

  "video/mp4",

  "audio/mpeg",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`${file.originalname} is not a supported file type.`));
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 30 * 1024 * 1024,

    files: 10,
  },
});

export default upload;
