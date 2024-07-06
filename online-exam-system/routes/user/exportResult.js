const express = require("express");

const router = express.Router();
const { exportQueMiddleware } = require("../../middlewares/exportQueMiddleware");
const {userScoreRenderEJS} = require("../../controller/user/userDatas/fetchUser");



router.route("/userScoreEJS")
  .get( exportQueMiddleware, userScoreRenderEJS );
  module.exports=router;