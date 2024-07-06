const con = require("../../config/dbConnection");
const { logger } = require("../../utils/pino");
const generateUniqueId = require("generate-unique-id");
const createExamPageController = (req, res) => {
  try {
    res.render("admin/createExam", { id: req.user.id });
  } catch (error) {
    logger.info(error.message);
  }
};
const addQuestionsPageController = async (req, res) => {
  try {
    // logger.info("addQuestionsPage")
    if (!req.query || !req.query.examid) {
      res.status(404).render('errorPage404')
    }
    const examId = parseInt(req.query.examid);
    const getExamDetailSQL = "select start_time,timestampdiff(second,utc_timestamp,start_time) as time from exam_details where id=? and isDeleted=0";

    try {
      const [result] = await con.query(getExamDetailSQL, examId);
      if (!result || result.length === 0 || (result[0] && result[0].length === 0)) {
        return res.status(404).render('errorPage404')
      }

      if (result && result[0] && result[0].start_time) {

        if (result[0].time < 0) {
          // return res.json({ success: 0, startingTimeError: 1 });
          return res.render("admin/addQuestions", { id: req.user.id, examId: examId, startingTimeError: 1 })
        }
      }
    } catch (error) {
      logger.error(error);
      return res.status(404).render('errorPage404')
    }

    res.render("admin/addQuestions", { id: req.user.id, examId: examId, startingTimeError: 0 })


  } catch (error) {
    logger.info(error.message);
  }
};

const examTopicsController = async (req, res) => {
  try {
    let getExamTopicsSql = `select topic, id from exam_topics where is_deleted="0"`;
    let [result] = await con.query(getExamTopicsSql);
    res.render("admin/examTopics", { category: result, categoryName: false, id: req.user.id });
  } catch (error) {
    logger.info(error.message);
  }
};

const addCategoryController = async (req, res) => {
  let category = req.query.category;
  let namePattern = /([a-zA-Z0-9_\s]+)/;
  try {
    let getCategorySql = `select * from exam_topics where is_deleted="0"`;
    let [getCategory] = await con.query(getCategorySql);
    let topics = [];
    getCategory.forEach((element) => {
      topics.push(element.topic.toLowerCase());
    });
    if (topics.includes(category.toLowerCase())) {
      res.json({ success: 0, message: "category already addedd" });
    }
    else if (category == "") {
      res.json({ success: 0, message: "please enter category" })
    }
    else if (!namePattern.test(category)) {
      res.json({ success: 0, message: "Please enter valid category" })
    }
    else {
      let insertTopicsSql = `insert into exam_topics(topic) values(?);`;
      let [result] = await con.query(insertTopicsSql, [category]);
      res.json({ success: 1, categoryName: category });
      // res.render("admin/examTopics", { categoryName: category, id: req.user.id });
    }
  } catch (err) {
    logger.info(err.message);
  }
};

const deleteCategoryController = async (req, res) => {
  try {
    let id = req.params.id;

    let deleteTopicsSql = `update exam_topics set is_deleted="1" where id=?`;
    let deleteQuestions = `update questions set isDeleted="1" where topic_id =?`
    let [result] = await con.query(deleteTopicsSql, [id]);
    let [result2] = await con.query(deleteQuestions, [id]);
    res.json({ success: 1 });
  } catch (err) {
    logger.info(error.message);
  }
};

const editCategoryController = async (req, res) => {
  let id = req.query.id;
  let category = req.query.category;
  let namePattern = /([a-zA-Z0-9_\s]+)/;
  try {
    let getCategorySql = `select * from exam_topics where is_deleted="0"`;
    let [getCategory] = await con.query(getCategorySql);
    let topics = [];
    getCategory.forEach((element) => {
      topics.push(element.topic);
    });
    if (topics.includes(category)) {
      res.json({ success: 0, message: "category already addedd" });
    }
    else if (category == "") {
      res.json({ success: 0, message: "please enter category" })
    }
    else if (!namePattern.test(category)) {
      res.json({ success: 0, message: "Please enter valid category" })
    }
    else {
      let editTopicsSql = `update exam_topics set topic="${category}" WHERE id =${id}`;
      let [result] = await con.query(editTopicsSql);
      res.json({ success: 1 });
    }

  } catch (err) {
    logger.info(error.message);
  }
};

const getExamTopicsController = async (req, res) => {
  try {
    let getExamTopicsSql = `select topic from exam_topics where is_deleted=0`;

    let [result] = await con.query(getExamTopicsSql);
    // console.log(result);

    result = result.reduce((prev, cur) => {
      if (typeof prev.topic === "string") prev.topic = [prev.topic];
      else prev.topic.push(cur.topic);

      return prev;
    }, result[0]);
    res.json({ success: 1, result: result });
    // res.render('admin/examTopics')
  } catch (error) {
    logger.info(error.message);
  }
};
const getExamDifficultiesController = async (req, res) => {
  try {
    let getExamDifficultiesSql = `select difficulty from difficulty_levels`;

    let [result] = await con.query(getExamDifficultiesSql);
    // console.log(result);

    result = result.reduce((prev, cur) => {
      if (typeof prev.difficulty === "string")
        prev.difficulty = [prev.difficulty];
      else prev.difficulty.push(cur.difficulty);

      return prev;
    }, result[0]);
    res.json({ success: 1, result: result });
    // res.render('admin/examTopics')
  } catch (error) {
    logger.info(error.message);
  }
};

const getDifficultyId = async (difficulty) => {
  let getDifficultyIdSql = `select id from difficulty_levels where difficulty=?`;

  let [result] = await con.query(getDifficultyIdSql, difficulty);

  return result;
};
const getTopicId = async (topic) => {
  let getTopicIdSql = `select id from exam_topics where topic=?`;

  let [result] = await con.query(getTopicIdSql, topic);
  return result;
};

const getDifficulties = async () => {
  let getDifficultiesSql = `select id,difficulty from difficulty_levels `;
  let [result] = await con.query(getDifficultiesSql);

  let resultObj = {};
  result.forEach((el) => {
    resultObj[el.difficulty] = el.id;
  });

  return resultObj;
};
const getTopics = async () => {
  let getTopicsSql = `select id,topic from exam_topics `;
  let [result] = await con.query(getTopicsSql);

  let resultObj = {};
  result.forEach((el) => {
    resultObj[el.topic] = el.id;
  });
  return resultObj;
};

const numberCheck = (num) => !isNaN(num);

const insertExamController = async (req, res) => {
  try {
    let insertExamSql =
      "INSERT INTO  exam_details (creater_id, title, start_time, duration_minute, total_marks, passing_marks, instructions, exam_status, exam_activation_code) VALUES (?);";

   
    let adminId = null;
    // testing 
    if (req.user && req.user.id) {
      adminId = req.user.id;
    }
    let reqBody = req.body;

    let examStatus = 0;

    //todo: generate random uid for exam-code
    let examCode = generateUniqueId({ length: 6, useLetters: false, useNumbers: true });

    

    //temp validations 
    reqBody.title = reqBody.title && reqBody.title.trim();
    reqBody.instructions = reqBody.instructions && reqBody.instructions.trim();
    let validationsFailedArray = [];
    if (!reqBody.title) validationsFailedArray.push("title");
    if (!reqBody.startingTime) validationsFailedArray.push("startingTime"); //todo: time validate
    if (!reqBody.duration || !numberCheck(reqBody.duration))
      validationsFailedArray.push("duration");
    if (!reqBody.totalMarks || !numberCheck(reqBody.totalMarks))
      validationsFailedArray.push("totalMarks");
    if (!reqBody.passingMarks || !numberCheck(reqBody.passingMarks))
      validationsFailedArray.push("passingMarks");
    if (!reqBody.instructions) validationsFailedArray.push("instructions");

    if (reqBody.startingTime && isNaN(new Date(reqBody.startingTime).getTime())) validationsFailedArray.push("startingTime");
    let validateUpcomingDateAndTime = (date) => new Date(date) > new Date();

    if (reqBody.startingTime && !validateUpcomingDateAndTime(reqBody.startingTime)) validationsFailedArray.push("startingTime");//todo: time validate
    if (reqBody.totalMarks && numberCheck(reqBody.totalMarks) && parseInt(reqBody.totalMarks) <= 0) validationsFailedArray.push("totalMarks");
    if (reqBody.title && reqBody.title.length > 255) validationsFailedArray.push("title");
    if (reqBody.passingMarks && reqBody.totalMarks && parseInt(reqBody.passingMarks) > parseInt(reqBody.totalMarks)) validationsFailedArray.push("passingMarks");

    if (reqBody.duration && (parseInt(reqBody.duration) > 300 || parseInt(reqBody.duration) <= 0)) validationsFailedArray.push("duration");

    if (validationsFailedArray.length != 0) {
      return res.json({
        success: 0,
        message: "Fill details properly",
        validationsFailedArray,
      });
    }

    let insertExamSqlParam = [
      adminId,
      reqBody.title,
      new Date(reqBody.startingTime),
      parseInt(reqBody.duration),
      parseInt(reqBody.totalMarks),
      parseFloat(reqBody.passingMarks),
      reqBody.instructions,
      examStatus,
      examCode,
    ];

    let [examInsertResult] = await con.query(insertExamSql, [
      insertExamSqlParam,
    ]);

    res.json({ success: 1, examId: examInsertResult.insertId });


  } catch (error) {
    logger.error(error);
  }
};

//DELETE EXAM
const deleteExamController = async (req, res) => {
  try {
    let examID = req.body.examID
    // console.log(examID);
    let deleteExamSQL1, deleteExamSQL2, deleteExamSQL3, selectQuestionSQL;

    selectQuestionSQL = `select id from questions where exam_id = ?`;
    let [selectQuestionResult] = await con.query(selectQuestionSQL, [examID]);
    let resultValue = selectQuestionResult.map(row => row.id);

    // console.log(resultValue);
    deleteExamSQL1 = `UPDATE exam_details SET isDeleted = ?  WHERE id = ?`;
    let [deleteExamResult1] = await con.query(deleteExamSQL1, [1, examID]);

    deleteExamSQL2 = `UPDATE options SET isDeleted = ?  WHERE question_id IN (?)`;
    if (resultValue && resultValue.length > 0) {
      let [deleteExamResult2] = await con.query(deleteExamSQL2, [1, resultValue]);
    }

    deleteExamSQL3 = `UPDATE questions SET isDeleted = ?  WHERE exam_id = ?`;
    let [deleteExamResult3] = await con.query(deleteExamSQL3, [1, examID])

    res.json({ success: "yes" });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  createExamPageController,
  addQuestionsPageController,
  examTopicsController,
  getExamTopicsController,
  getExamDifficultiesController,
  insertExamController,
  deleteCategoryController,
  addCategoryController,
  editCategoryController,
  deleteExamController
};
