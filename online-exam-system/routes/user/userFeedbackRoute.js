let express = require("express");
let router = express.Router();
const { cacheControl } = require("../../middlewares/authValidation");
const {
  userFeedbackController,
  getFeedbacks,
} = require("../../controller/user/userFeedback/userFeedbackController");
const passport = require("passport");
const userHasPermissions = require("../../middlewares/permission");

router.use(
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userHasPermissions
);

router.route("/").get(cacheControl, userFeedbackController);

router.route("/getAllFeedbacks").get(cacheControl, getFeedbacks);

module.exports = router;
