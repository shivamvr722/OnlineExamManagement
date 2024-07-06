let express = require("express");
const { startExam, showExam, examList, submitAnswer, checkMarks, verifyCode } = require("../../controller/user/examdetailsController/examController");
const passport = require("passport");
const { hasExamCode } = require("../../middlewares/auth");
const userHasPermission = require("../../middlewares/permission");
const {notifyUser} = require("../../controller/admin/examNotify");

let router = express.Router();

router.use(passport.authenticate("jwt", { session: false, failureRedirect: "/" }), userHasPermission)

router.route("/startexam")
  .get(hasExamCode, startExam)

router.route("/showexam")
  .get(hasExamCode, showExam)

router.route("/examList")
  .get(examList)

router.route("/examList")
  .post(verifyCode);

router.route("/submitexam")
  .post(submitAnswer)

router.route("/checkmark")
  .get(checkMarks)


router.route("/expired")
  .get((req, res) => { res.render("expirePage") })

router.route("/examnotifications")
.get(notifyUser);

module.exports = router;