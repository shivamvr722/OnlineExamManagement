const express = require("express");
const { exportQuestionsPageController } = require("../../controller/admin/questionsControllers/exportQuestionsController");
const { exportQueMiddleware } = require("../../middlewares/exportQueMiddleware");
const {cacheControl} = require("../../middlewares/authValidation");

let router = express.Router();
// router.use(exportQueMiddleware);
router.route("/questions/exportPage")
  .get(cacheControl, exportQueMiddleware, exportQuestionsPageController);


module.exports = router;
