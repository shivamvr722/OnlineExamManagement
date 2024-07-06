const con = require('../../../config/dbConnection');
const { generateQuestionsPdfByExamId, generateQuestionsCSVByExamId } = require('../../../utils/pdfAndCsvGenerator');
const { logger } = require('../../../utils/pino');
const { getTopics, getDifficulties, getExamTotalMarksFromQuestionsTable, getExamMarksFromExamTable } = require('./insertQuestionsController');

const isNumber = (num) => !isNaN(num);
const updateQuestionsPageController = async (req, res) => {


  try {

    if (!req.query || !req.query.examid) {
      res.status(404).render('errorPage404')
    }
    const getExamDetailSQL = "select title,start_time,timestampdiff(second,utc_timestamp,start_time) as time from exam_details where id=? and isDeleted=0";

    let examId = req.query.examid;

    let examTitle = "";
    try {
      const [result] = await con.query(getExamDetailSQL, examId);

      examTitle = result[0].title;
      // console.log(typeof (result));
      if (!result || result.length === 0) {
        return res.status(404).render('errorPage404')
      }
      if (result && result[0] && result[0].start_time) {

        if (result[0].time < 0) {
          // return res.json({ success: 0, startingTimeError: 1 });
          return res.render("admin/updateQuestions", { id: req.user.id, examId, startingTimeError: 1 })
        }
      }
    } catch (error) {
      logger.error(error);
      return res.status(404).render('errorPage404')
    }


    let selectQuestionsByExamIdSql = "SELECT * FROM questions  WHERE exam_id = ? and isDeleted=false"

    let [selectQuestionsByExamIdResult] = await con.query(selectQuestionsByExamIdSql, examId);

    // console.log(selectQuestionsByExamIdResult);
    let topics = await getTopics();
    let difficulties = await getDifficulties();
    if (selectQuestionsByExamIdResult.length === 0) {
      selectQuestionsByExamIdResult.id = [];
      return res.render("admin/updateQuestions", { data: selectQuestionsByExamIdResult, options: {}, topics, difficulties, examId, id: req.user.id, startingTimeError: 0 });

    }

    selectQuestionsByExamIdResult = selectQuestionsByExamIdResult.reduce((prev, cur) => {
      if (typeof (prev.id) === "number") prev.id = [prev.id];
      else prev.id.push(cur.id);
      if (typeof (prev.exam_id) === "number") prev.exam_id = [prev.exam_id];
      else prev.exam_id.push(cur.exam_id);
      if (typeof (prev.difficulty_id) === "number") prev.difficulty_id = [prev.difficulty_id];
      else prev.difficulty_id.push(cur.difficulty_id);
      if (typeof (prev.topic_id) === "number") prev.topic_id = [prev.topic_id];
      else prev.topic_id.push(cur.topic_id);
      if (typeof (prev.questions) === "string") prev.questions = [prev.questions];
      else prev.questions.push(cur.questions);
      if (typeof (prev.score) === "number") prev.score = [prev.score];
      else prev.score.push(cur.score);

      return prev;
    }, selectQuestionsByExamIdResult[0]);

    let selectOptionsByQueIdSql = "SELECT id,question_id,option_value,isAnswer FROM options  WHERE question_id in (?) and isDeleted=false"


    let selectOptionsByQueIdResult = await con.query(selectOptionsByQueIdSql, [selectQuestionsByExamIdResult.id]);

    let optionsObj = {};
    //optionsObj = {
    //   '1':{ option obj  },
    // '2' : {},..
    // }
    selectQuestionsByExamIdResult.id.forEach(id => {
      optionsObj[id] = selectOptionsByQueIdResult[0].filter(obj => obj.question_id === id);
    });



    res.render("admin/updateQuestions", { data: selectQuestionsByExamIdResult, options: optionsObj, topics, difficulties, examId, id: req.user.id, startingTimeError: 0 });
  } catch (error) {
    logger.error(error)
  }
}
const updateQuestionsValidations = async (req, res, questionsArray) => {
  try {
    const MAX_LENGTH_QUESTION_TEXT = 1000;

    //todo: improve
    //temp validations
    if (!req.body.examId) {
      return res.json({ success: 0, message: "exam Id error" })
    }
    let validationsFailedObj = {};
    //validations
    questionsArray.forEach(async (que, index) => {
      // console.log(que);
      if (que.id === -1 && que.isDeleted === 1) return;
      let validationsFailedArray = [];
      let options = que.options;
      //temp validations
      que.difficulty = que.difficulty.trim();
      que.topic = que.topic.trim();
      que.text = que.text.trim();

      if (!que.difficulty) validationsFailedArray.push("difficulty");
      if (!que.topic) validationsFailedArray.push("topic");
      if (!que.text) validationsFailedArray.push("text");
      if (!que.score) validationsFailedArray.push("score");

      if (!isNumber(que.correctId)) validationsFailedArray.push("correctId");
      if (!isNumber(que.score)) validationsFailedArray.push("score");
      if (isNumber(que.score) && (que.score > 5 || que.score < 1)) validationsFailedArray.push("score");


      if (que.text && que.text.length > MAX_LENGTH_QUESTION_TEXT) validationsFailedArray.push("text");

      options.forEach(async (option, index) => {
        option = option.trim();
        if (!option) validationsFailedArray.push(`option-${index + 1}`);
        else if (option.length > 255) validationsFailedArray.push(`option-${index + 1}`);

      });
      if (validationsFailedArray.length != 0) validationsFailedObj[index + 1] = validationsFailedArray;



    });
    if (Object.keys(validationsFailedObj).length !== 0) {
      return res.json({ success: 0, validationsFailedObj });
    }

    return true;
  } catch (error) {
    logger.error(error)
  }
}

const updateQuestionsController = async (req, res) => {
  try {


    let questionsArray = req.body.questions;
    let examId = req.body.examId;

    let topics = await getTopics();

    let difficulties = await getDifficulties();

    let examDetailsSQL = "select start_time,timestampdiff(second,utc_timestamp,start_time) as time from exam_details where id=?";
    let [examDetails] = await con.query(examDetailsSQL, examId);

    let startingTime = "";
    if (!examDetails || !examDetails[0]) {
      return res.json({ success: 0, examError: 1 });
    }
    if (examDetails && examDetails[0] && examDetails[0].start_time) {
      if (examDetails[0].time < 0) {
        return res.json({ success: 0, startingTimeError: 1 });
      }
    }
    let validationsRes = await updateQuestionsValidations(req, res, questionsArray);
    if (validationsRes !== true) {
      return;
    }
    let updateExamTotalMarksFlag = req.body.updateExamTotalMarks || 0;
    let examTotalMarksFromQuestionsTable = await getExamTotalMarksFromQuestionsTable(examId);
    let updatedQuestionTotalMarks = questionsArray.reduce((prev, cur) => {
      if (cur.isDeleted === 0) prev = prev + cur.score
      else if (cur.id !== -1) {//isDeleted=1 for all 

        //Temporary removal of the score of deleted questions
        // If the user deletes the question that is in DB, here is updating that count.
        // just to see if it is actually being deleted.
        examTotalMarksFromQuestionsTable = examTotalMarksFromQuestionsTable - cur.score;
      }
      return prev;
    }, 0);
    // console.log(updatedQuestionTotalMarks);
    if (updatedQuestionTotalMarks === 0) {
      return res.json({ success: 0, totalMarksError: 1 });
    }
    if (updateExamTotalMarksFlag === 0) {//if this is 1 then we have to insert questions anyway and update the total marks in exam detail table or else we have to check if marks conflicts or not

      let examMarks = await getExamMarksFromExamTable(examId);
      let totalExamMarks = examMarks.totalExamMarks;
      let currentPassingMarks = examMarks.currentPassingMarks;

      if (examMarks === -1) {
        totalExamMarks = 0;
        currentPassingMarks = 0;
      }

      if (examTotalMarksFromQuestionsTable === -1) examTotalMarksFromQuestionsTable = 0;

      if (totalExamMarks != (updatedQuestionTotalMarks)) {
        return res.json({ success: 0, totalExamMarks, newTotalMarks: updatedQuestionTotalMarks, currentPassingMarks: currentPassingMarks });
      }

    } else {

      const newTotalMarks = updatedQuestionTotalMarks;
      const newPassingMarks = req.body.newPassingMarks;
      if (newPassingMarks > newTotalMarks || newPassingMarks < 0) {
        return res.json({ success: 0, passingMarksValidate: 1 });
      }
      if (newPassingMarks != -1) {
        let updateExamSql = "update exam_details set total_marks = ? , passing_marks = ?  where id=?;"

        let [updateExamResult] = await con.query(updateExamSql, [newTotalMarks, newPassingMarks, examId]);
      }
    }

    questionsArray.forEach(async (que, index) => {
      try {
        if (que.id === -1 && que.isDeleted !== 1) {//new insertion needed
          // console.log(que.index);
          insertQuestionHelper(examId, difficulties, topics, que);
        } else {
          updateQuestionHelper(examId, difficulties, topics, que);
        }


      } catch (error) {
        console.log(error);
      }


    });

    //updating exam status to active after questions added
    // in case of 0 questions and insertin comes from update page 
    let updateExamStatusSQL = `UPDATE  exam_details SET exam_status = ? WHERE id = ?;`
    let [updateExamStatusResult] = await con.query(updateExamStatusSQL, [1, examId]);


    res.json({ success: 1 })

    //GENERATING PDF AND CSV FOR FUTURE DOWNLOAD
    let token = req.cookies.token;
    await generateQuestionsPdfByExamId(examId, token)
    await generateQuestionsCSVByExamId(examId);
  } catch (error) {
    logger.error(error)
  }
}
const insertQuestionHelper = async (examId, difficulties, topics, que) => {

  try {
    let insertQuestionSql = "INSERT INTO questions (`exam_id`, `difficulty_id`, `topic_id`, `questions`, `score`) VALUES (?)"

    let insertOptionSql = "INSERT INTO options (`question_id`, `option_value`, `isAnswer`) VALUES (?)";


    let options = que.options;
    let questionSqlParam = [examId, difficulties[que.difficulty.toLowerCase()], topics[que.topic.toLowerCase()], que.text, que.score];
    let [questionInsertResult] = await con.query(insertQuestionSql, [questionSqlParam]);


    let questionInsertedId = questionInsertResult.insertId;
    options.forEach(async (option, index) => {
      let isAns = false;
      if (index + 1 === que.correctId) isAns = true;
      let optionSqlParam = [questionInsertedId, option, isAns];
      let [optionInsertResult] = await con.query(insertOptionSql, [optionSqlParam]);
    });

  } catch (error) {
    logger.error(error)
  }
}
const updateQuestionHelper = async (examId, difficulties, topics, que) => {
  try {

    let updateQuestionSql = "UPDATE  questions SET  `difficulty_id`=?, `topic_id`=?, `questions`=?, `score`=? WHERE id=?"
    let options = que.options;
    let optionIds = que.optionIds;

    let updateOptionSql = "UPDATE  options SET  `option_value`=?, `isAnswer`=? where id=?";

    let updateDeletedQuestionSql = "UPDATE  questions SET isDeleted=1 WHERE id=?"

    let updateDeletedOptionSql = "UPDATE  options SET isDeleted=1 WHERE id=?"

    if (que.isDeleted) {
      let [questionDeleteResult] = await con.query(updateDeletedQuestionSql, que.id);

      options.forEach(async (option, index) => {
        let isAns = false;
        if (index + 1 === que.correctId) isAns = true;
        let [optionInsertResult] = await con.query(updateDeletedOptionSql, optionIds[index]);
      });
    } else {

      let questionSqlParam = [difficulties[que.difficulty], topics[que.topic], que.text, que.score, que.id];

      let [questionUpdateResult] = await con.query(updateQuestionSql, questionSqlParam);

      options.forEach(async (option, index) => {
        let isAns = false;
        if (index + 1 === que.correctId) isAns = true;
        let [optionInsertResult] = await con.query(updateOptionSql, [option, isAns, optionIds[index]]);
      });
    }
  } catch (error) {
    logger.error(error)
  }
}
module.exports = { updateQuestionsController, insertQuestionHelper, updateQuestionsPageController }