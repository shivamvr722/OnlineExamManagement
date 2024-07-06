const multer = require("multer");
const notifier = require('node-notifier'); 
const maxSize = 2 * 1024 * 1024; // 2MB
var fs = require('fs');
const path = require("path");
var profileImageDir = `uploads/profileImages`;
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(profileImageDir + "/" + req.body.id)) {
      fs.mkdirSync(profileImageDir + "/" + req.body.id, { recursive: true })//mkdir if not exist
    }
    cb(null, profileImageDir + "/" + req.body.id);
  },
  filename: (req, file, cb) => {
    let newFileName = "profileImage_" + req.body.id + "_" + Date.now() + "_" + file.originalname;
    req.body.newFileName = newFileName;
    req.body.filePath = `/${req.body.id}/${newFileName}`
    cb(null, newFileName);
  },
});

const whitelistExtentions = ['.jpg','.jpeg','.png'];
let upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) { 
    let fileExtention = path.extname(file.originalname).toLowerCase(); 
    if (!whitelistExtentions.includes(fileExtention)) { 
      req.fileValidationError = "File type Error"; 
      return cb(null, false);
    }
    cb(null, true); 
  }
}).single("image");

const uploadProfileImageMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        notifier.notify(`Please upload valid file size must be less than 2MB`); 
        return res.json({ success: 0, message: "File limit error", fileLimitError: 1 }) 
      }
    }
    next();
  });
}

module.exports = { uploadProfileImageMiddleware };