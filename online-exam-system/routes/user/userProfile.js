const express = require("express");
const path = require("path");
const router = express.Router();
const passport = require("passport");
const userHasPermission = require("../../middlewares/permission");
const { uploadProfileImageMiddleware } = require("../../middlewares/uploadProfileImageMiddleware");
const { exportExamResultScoreAsPDF } = require("../../controller/user/userDatas/exportPDF");
const { cacheControl } = require("../../middlewares/authValidation");

// rendering routes
const { userDashboard, userProfile, updateUserRender, userScoreRender, resultsRender } = require("../../controller/user/userComponent/userProfile");
const { updateUser, sendFile, getScores, dbUsers, removeProfile, results, resultSearch } = require("../../controller/user/userDatas/fetchUser");


router.use(passport.authenticate("jwt", { session: false, failureRedirect: "/" }), userHasPermission);



router.route("/userDashboard")
  .get(cacheControl,userDashboard);

router.route("/userProfile")
  .get(cacheControl, userProfile);

router.route("/userProfile/update")
  .get(cacheControl,updateUserRender);

router.route("/userScore")
  .get(cacheControl, userScoreRender);

router.route("/results")
  .get(cacheControl,resultsRender);


// data transaction routes


router.route("/")
  .get(cacheControl, dbUsers)

router.route("/profileImage")
  .get(cacheControl, sendFile);

router.route("/userProfile/update")
  .post(uploadProfileImageMiddleware, updateUser);

router.route("/getScores")
  .get(cacheControl, getScores);

router.route("/removeProfile")
  .post(removeProfile);

router.route("/getresults")
  .get(cacheControl, results);

// search Route
router.route("/searchResult")
  .get(cacheControl, resultSearch);

// pdf route
router.route("/generateScoreCardPDF")
  .get(cacheControl, exportExamResultScoreAsPDF);



module.exports = router;