import multer from "multer"
import fs from 'fs'
import ApiError from "../../utils/apiError"

const directory = path.join(__dirname, "../../uploads/resume")

// if folder dont exist, create new
if (!fs.existsSync(directory)) {
    // Synchronously creates a directory.
    fs.mkdirSync(directory, { recursive: true })
}

// configuration for setting in disk
const multerDiskStorage = multer.diskStorage(
    {
        // while dealing with filer whenever need to return output call the cb means callback
        // cause cb(fisrt para is error so we should pass null and seconf is result where we can pass output)
        destination: function (req, file, cb) {
            cb(null, directory)
        },
        filename: function (req, file, cb) {

            // generating unique filename
            const extension = path.extname(file.originalname)
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            // means simply remove extension from original file name?
            const nameWithoutExt = path.basename(file.originalname, extension)
            const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
            cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
        }
    }
)

// this memorystorage do not store in disk but stores in ram temporary while just used to parse only
const memoryStorage = multer.memoryStorage()

// to upload anything we provide storage, and filefilter confgiuration

const fileFilter = (req, file, next) => {

    const allowedTypes = [

        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'text/plain', // .txt
    ]
    const allowedExtension = ['.pdf', '.docx', '.doc', '.txt']
    console.log(file)
    const extname = path.extname(file.originalname)
    if ((allowedTypes.includes(file.mimetype)) && (allowedExtension.includes(extname))) {
        cb(null, true)
    } else {
        cb(
            new ApiError(400, `This invalid file format doesnt help to upload. please provide pdf , docx , doc , txt file`)
            ,
            false
        )
    }


}

const limits = (req,file,cb) =>{                    
    fileSize:parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
}

const uploadResumeOnDisk =  multer (
    {
        storage:multerDiskStorage,
        fileFilter:fileFilter,
        limits:limits
    }
).single('resume')

// this return express middleware
const uploadResumeOnRam = multer(
    {
        storage:memoryStorage,
        fileFilter:fileFilter,
        limits:limits
    }
).single('resume')

// this return middleware cause it can be used in routes
// uploadFunction is bascially uploadResumeOnDisk
const handleUploadResumeError = (uploadFunction)=>{

    return (req,res,next)=>{
        uploadFunction(req,res,(err)=>{
            if(err instanceof multer.MulterError){

                if(err.code === 'LIMIT_FILE_SIZE'){
                    // here error is not passed to cb cause cb is used to tell multer middleware that there is some error dont upload it
                    return next(new ApiError(401,`File too large . Max size is ${process.env.MAX_FILE_SIZE} || 10MB`))
                }
                if(err.code === 'LIMIT_UNEXPECTED_FILE'){
                    return next(new ApiError(401,'Unexpected field name. Use "resume" as field name '))
                }

                // if not any one of them error means 
                return next(new ApiError(400, `Upload error: ${err.message}`));

            }else if (err){
                // Other errors (like file filter errors)
                return next(err)
            }

            if(!req.file){
                return next (new ApiError(401,'Please provide file'))
            }
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

const validateBeforeUpload = (req,res,next)=>{
    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }
    
      const file = req.file;
    
      // Additional validation
      if (file.size === 0) {
        throw new ApiError(400, 'Uploaded file is empty');
      }
    
      // Check if file has content (for buffer)
      if (file.buffer && file.buffer.length === 0) {
        throw new ApiError(400, 'Uploaded file has no content');
      }
    
      // Validate original filename
      if (!file.originalname || file.originalname.length > 255) {
        throw new ApiError(400, 'Invalid filename');
      }
    
      next();
}

/**
 * Clean up uploaded file on error
 */
const cleanupOnError = (err, req, res, next) => {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          logger.error(`Failed to delete file: ${req.file.path}`, unlinkErr);
        }
      });
    }
    next(err);
  };

  export default s={
    uploadResume:handleUploadResumeError(uploadResumeOnDisk),
    uploadResumeMemory:handleUploadResumeError(uploadResumeOnRam),
    validateAfterUpload,
    cleanupOnError,
  }
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