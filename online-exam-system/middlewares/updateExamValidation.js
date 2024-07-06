const jwt = require("jsonwebtoken");
const { logger } = require("../utils/pino");
const con = require("../config/dbConnection");

const updateExamDetailsValidation = async (req, res, next) => {
  try {
    const {
      id,
      title,
      start_time,
      duration_minute,
      passingmarks,
      instructions,
    } = req.body;
    let getTotalMarks = `select total_marks from exam_details where id = ?`;
    let [result] = await con.query(getTotalMarks, [id]);
    let totalmarks = result[0].total_marks;
    let validateUpcomingDateAndTime = (date) => new Date(date) > new Date();
    if (
      title.length >= 255 ||
      !validateUpcomingDateAndTime(start_time) ||
      duration_minute > 300 ||
      passingmarks >= totalmarks ||
      instructions.length > 65535
    ) {
      return res.json({ incorrect: true });
    } else {
      next();
    }
  } catch (error) {
    logger.log(error);
  }
};

module.exports = { updateExamDetailsValidation };
