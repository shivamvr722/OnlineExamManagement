const con = require("../../config/dbConnection");
const schedule = require('node-schedule');
const { checkLogin } = require("../authentication/authenticationController");

// schedule.scheduleJob("*/10 * * * * *", function(){
//   notifyUser();
//   notificationsCount();
// })

const notifyUser = async (req, res) => {
  try {
    let currentDate = new Date();
    let oneHourAfter = new Date(currentDate.getTime() + 60 * 60 * 1000);
    let notifyUserSql = `select title ,start_time  from exam_details join questions on exam_details.id = questions.exam_id where date(start_time) = utc_date() AND time(start_time) > utc_time() GROUP BY exam_details.id ;`;
    let [result] = await con.query(notifyUserSql, [currentDate, oneHourAfter]);
    let time = currentDate.getTime();
    // res.json({success:1, message:result});
    return result;
  } catch (err) {
    console.log(err.message);
  }
}

const notificationsCount = async (req, res) => {
  try {
    let currentDate = new Date();
    let oneHourAfter = new Date(currentDate.getTime() + 60 * 60 * 1000)
    let notificationsCount = `select count(*) as notifications from exam_details join questions on exam_details.id = questions.exam_id where date(start_time) = utc_date() AND time(start_time) > utc_time() GROUP BY exam_details.id ;`
    let [notifications] = await con.query(notificationsCount, [currentDate, oneHourAfter]);
    return notifications;
  } catch (err) {
    console.log(err.message)
  }
}

module.exports = { notifyUser, notificationsCount };