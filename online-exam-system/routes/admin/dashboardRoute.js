const express = require("express")
const { dashboardPageController,adminProfilePageController,examTableController,adminProfileUpdateController
    ,adminProfileUpdatePageController,adminProfilePhotoUpload,setPhotoController,removePhotoController} = require("../../controller/admin/dashboardController");
const { uploadProfileImageMiddleware} = require('../../middlewares/uploadProfileImageMiddleware')
const{analysisPageContoller} = 
require('../../controller/admin/analysisController');
const passport = require("passport");
const userHasPermission = require("../../middlewares/permission")
let router = express.Router();

router.use(passport.authenticate("jwt",
 { session: false, failureRedirect: "/" }),userHasPermission)

const {cacheControl} = require("../../middlewares/authValidation");

  router.
  route("/")
  .get( cacheControl ,dashboardPageController);
  
  router.
  route("/examTable").all(cacheControl ,examTableController);
  
  router.
  route("/adminProfile").get(cacheControl, adminProfilePageController);
  
  router.
  route("/adminProfileUpdate").get(cacheControl, adminProfileUpdateController);
  
  router.
  route("/adminProfileUpdatePage").post(adminProfileUpdatePageController);
  
  router.
  route("/adminProfilePhotoUpload") .post(uploadProfileImageMiddleware,adminProfilePhotoUpload);
  
  router.
  route("/setPhoto/:id").get(cacheControl, setPhotoController);
  
  router.
  route("/removePhoto") .post(removePhotoController);
  
  router.
  route("/analysis") .get(cacheControl, analysisPageContoller);

  
  module.exports = router
