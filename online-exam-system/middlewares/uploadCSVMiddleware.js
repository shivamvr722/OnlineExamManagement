const multer = require("multer");
const maxSize = 1 * 1024 * 1024; // 1MB

let fs = require('fs');
const path = require("path");
let csvDir = process.env.CSV_UPLOAD_PATH;
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(csvDir + "/" + req.body.examid)) {
      fs.mkdirSync(csvDir + "/" + req.body.examid, { recursive: true })//mkdir if not exist
    }
    cb(null, csvDir + "/" + req.body.examid);
  },
  filename: (req, file, cb) => {
    // console.log(file.originalname);
    // cb(null, file.originalname);
    let newFileName = "exam_" + req.body.examid + "_" + Date.now() + "_" + file.originalname;
    req.body.newFileName = newFileName
    req.body.filePath = `/${req.body.examid}/${newFileName}`
    cb(null, newFileName);
  },
});

const whitelistMimeType = [
  'text/csv'
]
const whitelistExtentions = [
  '.csv'
]
let upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    let fileExtention = path.extname(file.originalname).toLowerCase();
    if (!whitelistMimeType.includes(file.mimetype) || !whitelistExtentions.includes(fileExtention)) {
      req.fileValidationError = "File type Error";
      return cb(null, false);
    }
    cb(null, true);
  }
}).single("csv");

const uploadCSVMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.json({ success: 0, message: "File limit error", fileLimitError: 1 })
      }
    }
    next();
  });
}
module.exports = { uploadCSVMiddleware };

