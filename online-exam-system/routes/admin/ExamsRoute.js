const express = require("express");
const { createExamPageController, addQuestionsPageController, examTopicsController, getExamTopicsController, getExamDifficultiesController, addCategoryController, deleteCategoryController, insertExamController, editCategoryController,deleteExamController } = require("../../controller/admin/examController");

const { updateQuestionsController, updateQuestionsPageController } = require("../../controller/admin/questionsControllers/updateQuestionsController");
const { insertQuestionsController } = require("../../controller/admin/questionsControllers/insertQuestionsController");
const { insertCSVController, downloadSampleCSV } = require("../../controller/admin/questionsControllers/insertCSVController");
const { uploadCSVMiddleware } = require("../../middlewares/uploadCSVMiddleware");
const { questionDetailsController, viewQuestionsPageController } = require("../../controller/admin/questionsControllers/questionsController");
const { exportQuestionsPageController, exportQuestionsControllerAsPdf, exportQuestionsControllerAsCSV } = require("../../controller/admin/questionsControllers/exportQuestionsController");
const {cacheControl} = require("../../middlewares/authValidation");
const passport = require("passport");
const userHasPermission = require("../../middlewares/permission");

let router = express.Router();

router.use(passport.authenticate("jwt", { session: false, failureRedirect: "/" }), userHasPermission)

router.route("/create")
  .get(cacheControl, createExamPageController)
router.route("/addQuestions")
  .get(cacheControl, addQuestionsPageController)
router.route("/updateQuestions")
  .get(cacheControl, updateQuestionsPageController);
router.route("/insertCSV")
  .post(uploadCSVMiddleware, insertCSVController);
router.route("/sampleCSV")
  .get(cacheControl, downloadSampleCSV);

router.route("/questions/export/pdf")
  .get(cacheControl, exportQuestionsControllerAsPdf)
router.route("/questions/export/csv")
  .get(cacheControl, exportQuestionsControllerAsCSV)

router.route("/questions/view").get(cacheControl, viewQuestionsPageController)


router.route("/topics")
  .get(cacheControl, examTopicsController);

router.route("/api/topics")
  .get(cacheControl, getExamTopicsController);

router.route("/api/difficulties")
  .get(cacheControl, getExamDifficultiesController);

router.route("/api/questions")
  .post(insertQuestionsController);

router.route("/api/create")
  .post(insertExamController);

router.route("/api/questions/update")
  .post(updateQuestionsController);

router.route("/api/questions/details")
  .post(questionDetailsController);

router.route("/topics")
  .post(addCategoryController);

router.route("/topics/deleteCategory/:id")
  .post(deleteCategoryController)

router.route("/topics/editCategory")
  .post(editCategoryController)


  router.route('/deleteExam')
.post(deleteExamController);


module.exports = router;
