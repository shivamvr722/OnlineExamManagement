const express = require("express");
const {updateExamDetailsValidation} = require('../../middlewares/updateExamValidation')
const {
  studentDetailsPage,
  getStudentDetails,
  studentResultDetails,
  resultDetails,
  exams,
  answerKey,
  allExamsPage,
  allExams,
  getExamRecords,
  adminFeedbackPostController,
  selectFeedback,
  examsRecord,
  updateExamsRecord,
  viewAdminFeedbackPostController
} = require("../../controller/admin/studentController");
const {cacheControl} = require("../../middlewares/authValidation");
const passport = require("passport");

const userHasPermission = require("../../middlewares/permission");
var router = express.Router();


router.use(passport.authenticate("jwt", { session: false, failureRedirect: "/" }),userHasPermission)

router.route("/studentdetailspage")
  .get(cacheControl, studentDetailsPage);

router.route("/getstudentdetails")
  .get(cacheControl, getStudentDetails);

router.route("/resultdetails")
  .get(cacheControl, studentResultDetails);

router.route("/getrecords")
  .all(resultDetails);

router.route("/getallexams")
  .get(cacheControl, exams);

router.route("/answerkey")
  .get(cacheControl, answerKey);

router.route("/allexamspage")
  .get(cacheControl, allExamsPage);

router.route("/allexams")
  .get(cacheControl, allExams);

router.route("/getexamrecords")
  .all(getExamRecords);

//ADMIN  FEEDBACK
router.
route("/adminFeedbackPost").post(adminFeedbackPostController);


router.
route("/viewAdminFeedback").post(viewAdminFeedbackPostController);




router.route("/selectFeedback").post(selectFeedback);


router.route("/selectFeedback").post(selectFeedback);


router.route("/examsrecord")
  .get(cacheControl, examsRecord);



router.route("/updateexamsrecord")
  .post(updateExamDetailsValidation,updateExamsRecord);

 
module.exports = router;
