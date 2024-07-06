const express = require("express");
const path = require("path");
const router = express.Router();
const passport = require("passport");
const userHasPermission = require("../../middlewares/permission");
const { exportQueMiddleware } = require("../../middlewares/exportQueMiddleware");
const {uploadProfileImageMiddleware} = require("../../middlewares/uploadProfileImageMiddleware");
const {exportExamResultScoreAsPDF} = require("../../controller/user/userDatas/exportPDF");


// rendering routes
const {userAnswerReview} = require("../../controller/user/userAnswerKey")


router.use(passport.authenticate("jwt", { session: false, failureRedirect: "/" }), userHasPermission);


router.route("/")
  .get(userAnswerReview);


  module.exports = router;