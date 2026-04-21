import multer from 'multer';
import fs from 'fs';
import path from 'path';
import ApiError from '../utils/apiError.js';
import logger from '../utils/logs.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const directory = path.join(__dirname, '../../uploads/resume');

// if folder dont exist, create new
if (!fs.existsSync(directory)) {
    // Synchronously creates a directory.
    fs.mkdirSync(directory, { recursive: true })
}

// configuration for setting in disk
const multerDiskStorage = multer.diskStorage(
  {
  destination(req, file, cb) {
    cb(null, directory);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const nameWithoutExt = path.basename(file.originalname, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${sanitizedName}-${uniqueSuffix}${extension}`);
  },
});

// to upload anything we provide storage, and filefilter confgiuration

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ]
  const allowedExtension = ['.pdf', '.docx'];
  const extname = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) && allowedExtension.includes(extname)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Only PDF and DOCX files are supported.'
      ),
      false
    );
  }


}

const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE || '', 10) || 10 * 1024 * 1024,
};

// this is a function to upload file using multer providing storage , filter , limits
const uploadResumeOnDisk = multer({
  storage: multerDiskStorage,
  fileFilter,
  limits,
}).single('resume');

// this return middleware cause it can be used in routes
// uploadFunction is bascially uploadResumeOnDisk
// whenever there is a error in multer it callback means a fxn is required to handle that error so what we do is we create a middleware wrap it over that and handle error fxn
const handleUploadResumeError = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err instanceof multer.MulterError) {

        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(
              400,
              `File too large . Max size is ${process.env.MAX_FILE_SIZE || '10MB'}`
            )
          );
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ApiError(400, 'Unexpected field name. Use "resume" as field name ')
          );
        }

        return next(new ApiError(400, `Upload error: ${err.message}`));
      }

      // this skipps all normal express middleware and goes to error handling middleware
      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next(new ApiError(400, 'Please provide file'));
      }

      // after .single multer creates req.file={}
      logger.info(`File uploaded: ${req.file.originalname}`, {
        size: req.file.size,
        mimetype: req.file.mimetype,
        userId: req.user?._id,
      });

        next()
        })
    }
}
// this checks after file is uploaded cause some features can be accessed after uploading
// use next(err ) when there is async operation
// when there is sync operation when we throw error express catches that error and transfer to error jander

const validateBeforeUpload = (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const file = req.file;

  if (file.size === 0) {
    throw new ApiError(400, 'Uploaded file is empty');
  }

  if (file.buffer && file.buffer.length === 0) {
    throw new ApiError(400, 'Uploaded file has no content');
  }

  if (!file.originalname || file.originalname.length > 255) {
    throw new ApiError(400, 'Invalid filename or To big file name...');
  }

  next();
};

const uploadResumeOnDiskMiddleware = handleUploadResumeError(uploadResumeOnDisk);

export {
  uploadResumeOnDiskMiddleware,
  validateBeforeUpload,
};

export default {
  uploadResumeOnDisk: uploadResumeOnDiskMiddleware,
  validateBeforeUpload,
};
// But Multer Is Special

// Multer middleware is slightly different.

// It supports this pattern:

// uploadResume(req, res, function(err) {
//    // handle error manually
// });

// Meaning:

// Instead of calling next(err) automatically,
// it gives you the error inside that callback.


// 🧠 Step 1 — Who Calls fileFilter?

// You did this:

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter
// });

// So you gave multer your function.

// You didn’t call it.

// You only handed it to multer.

// 🧠 Step 2 — Multer Stores It

// Internally, multer does something like:

// this.fileFilter = options.fileFilter;

// Now multer has your function stored.

// 🧠 Step 3 — When Request Comes

// When someone uploads a file:

// app.post("/upload", upload.single("resume"));

// Multer middleware runs.

// While processing file stream, multer does something like:

// this.fileFilter(req, file, function(err, accept) {
//    ...
// });

// IMPORTANT:

// 👉 Multer is the one calling your function.
// 👉 It passes req
// 👉 It passes file
// 👉 It creates and passes cb

// 🔥 So Where Did req Come From?

// When Express receives request:

// (req, res, next)

// Multer is a middleware.

// So multer already receives:

// (req, res, next)

// Then multer internally forwards that same req to your fileFilter.
