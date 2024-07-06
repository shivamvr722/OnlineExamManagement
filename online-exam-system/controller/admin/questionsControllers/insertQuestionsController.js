const con = require('../../../config/dbConnection');
const { generateQuestionsPdfByExamId, generateQuestionsCSVByExamId } = require('../../../utils/pdfAndCsvGenerator');
const { logger } = require('../../../utils/pino');
const getDifficulties = async () => {
  try {
    let getDifficultiesSql = `select id,difficulty from difficulty_levels `
    let [result] = await con.query(getDifficultiesSql);

    let resultObj = {};
    result.forEach((el) => {
      resultObj[el.difficulty.toLowerCase()] = el.id
    });

    return resultObj;
  } catch (error) {
    logger.error(error)
  }
}
const getTopics = async () => {
  try {
    let getTopicsSql = `select id,topic from exam_topics where is_deleted=0`
    let [result] = await con.query(getTopicsSql);

    let resultObj = {};
    result.forEach((el) => {
      resultObj[el.topic.toLowerCase()] = el.id
    });
    return resultObj;
  } catch (error) {
    logger.error(error)
  }
}
const isNumber = (num) => !isNaN(num);



const insertQuestionsValidations = async (req, res, questionsArray) => {
  try {
    let validationsFailedObj = {};
    const MAX_LENGTH_QUESTION_TEXT = 1000;

    //temp validations
    if (!req.body.examId) {
      return res.json({ success: 0, message: "exam Id error" })
    }
    //validations
    let difficultiesArrray = Object.keys(await getDifficulties());
    let topicsArrray = Object.keys(await getTopics());
    questionsArray.forEach(async (que, index) => {

      let validationsFailedArray = [];
      let options = que.options;

      que.text = que.text && que.text.trim();
      que.difficulty = que.difficulty && que.difficulty.trim().toUpperCase();
      que.topic = que.topic && que.topic.trim().toUpperCase();
      que.topic = que.topic && que.topic.trim().toUpperCase();

      if (!que.difficulty) validationsFailedArray.push("difficulty");
      if (!que.topic) validationsFailedArray.push("topic");
      if (!que.text) validationsFailedArray.push("text");
      if (!(que.score)) validationsFailedArray.push("score");
      if (!(que.correctId)) validationsFailedArray.push("correctId");

      if (!isNumber(que.correctId)) validationsFailedArray.push("correctId");
      if (!isNumber(que.score)) validationsFailedArray.push("score");
      if (isNumber(que.score) && (que.score > 5 || que.score < 1)) validationsFailedArray.push("score");

      if (que.text && que.text.length > MAX_LENGTH_QUESTION_TEXT) validationsFailedArray.push("text");

      if (que.correctId > 4 || que.correctId < 1) validationsFailedArray.push("correctId");

      if (!difficultiesArrray.includes(que.difficulty.toLowerCase())) validationsFailedArray.push("difficulty");
      if (!topicsArrray.includes(que.topic.toLowerCase())) validationsFailedArray.push("topic");

      options.forEach(async (option, index) => {
        option = option && option.trim();
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
const getExamMarksFromExamTable = async (examId) => {
  try {
    let getExamTotalMarksSql = `select total_marks,passing_marks from exam_details where id=${examId} AND isDeleted=0;`

    let [res] = await con.query(getExamTotalMarksSql, examId);
    if (!res || res.length === 0 || !res[0].total_marks) return -1;
    return {
      totalExamMarks: parseInt(res[0].total_marks),
      currentPassingMarks: parseInt(res[0].passing_marks)
    };

  } catch (error) {
    logger.error(error)
  }
}
const getExamTotalMarksFromQuestionsTable = async (examId) => {
  try {
    let sql = `select sum(score) as total_marks from questions where exam_id=${examId} && isDeleted=0;
    `

    let [res] = await con.query(sql, examId);
    if (!res || res.length === 0 || !res[0].total_marks) return -1;
    return parseInt(res[0].total_marks);

  } catch (error) {
    logger.error(error)
  }
}
const insertQuestionsController = async (req, res) => {
  try {
    let questionsArray = req.body.questions;
    let examId = req.body.examId;

    let examDetailsSQL = "select start_time,timestampdiff(minute,utc_timestamp,start_time) as time from exam_details where id=? AND isDeleted=0";
    let [examDetails] = await con.query(examDetailsSQL, examId);

    if (!examDetails || !examDetails[0]) {
      return res.json({ success: 0 });
    }

    if (examDetails && examDetails[0] && examDetails[0].start_time) {
      if (examDetails[0].time < 0) {
        return res.json({ success: 0, startingTimeError: 1 });
      }
    }
    let topics = await getTopics();

    let difficulties = await getDifficulties();

    let updateExamTotalMarksFlag = req.body.updateExamTotalMarks || 0;


    let insertQuestionSql = "INSERT INTO questions (`exam_id`, `difficulty_id`, `topic_id`, `questions`, `score`) VALUES (?)"

    let insertOptionSql = "INSERT INTO options (`question_id`, `option_value`, `isAnswer`) VALUES (?)";

    let validationsRes = await insertQuestionsValidations(req, res, questionsArray);
    // console.log(validationsRes);
    if (validationsRes !== true) {
      return;
    }

    let examTotalMarksFromQuestionsTable = await getExamTotalMarksFromQuestionsTable(examId);
    let insertedQuestionTotalMarks = questionsArray.reduce((prev, cur) => prev = prev + cur.score, 0);

    // console.log(insertedQuestionTotalMarks);
    if (insertedQuestionTotalMarks === 0) {
      return res.json({ success: 0, totalMarksError: 1 });
    }
    if (updateExamTotalMarksFlag === 0) {//if this is 1 then we have to insert questions anyway and update the total marks in exam detail table or else we have to check if marks conflicts or not
      // console.log(updateExamTotalMarksFlag);
      let examMarks = await getExamMarksFromExamTable(examId);
      let totalExamMarks = examMarks.totalExamMarks;
      let currentPassingMarks = examMarks.currentPassingMarks;


      if (examMarks === -1) {
        totalExamMarks = 0;
        currentPassingMarks = 0;
      }



      if (examTotalMarksFromQuestionsTable === -1) examTotalMarksFromQuestionsTable = 0;


      // console.log(examTotalMarksFromQuestionsTable, totalExamMarks, insertedQuestionTotalMarks);
      if (totalExamMarks != (examTotalMarksFromQuestionsTable + insertedQuestionTotalMarks)) {
        return res.json({ success: 0, totalExamMarks, newTotalMarks: examTotalMarksFromQuestionsTable + insertedQuestionTotalMarks, currentPassingMarks: currentPassingMarks });
      }




    } else {
      // console.log(totalExamMarks, examTotalMarksFromQuestionsTable, insertedQuestionTotalMarks);

      let newTotalMarks = examTotalMarksFromQuestionsTable + insertedQuestionTotalMarks;
      if (examTotalMarksFromQuestionsTable === -1) {
        newTotalMarks = insertedQuestionTotalMarks;
      }
      const newPassingMarks = parseInt(req.body.newPassingMarks);

      // console.log(newTotalMarks, newPassingMarks);
      if (newPassingMarks > newTotalMarks || newPassingMarks < 0) {
        return res.json({ success: 0, passingMarksValidate: 1 });
      }
      if (newPassingMarks != -1) {
        let updateExamSql = "update exam_details set total_marks = ? , passing_marks = ?  where id=? ;"

        let [updateExamResult] = await con.query(updateExamSql, [newTotalMarks, newPassingMarks, examId]);
      }


    }




    //inserting 
    questionsArray.forEach(async (que, index) => {
      que.score = parseInt(que.score);
      que.correctId = parseInt(que.correctId);
      let questionSqlParam = [examId, difficulties[que.difficulty.toLowerCase()], topics[que.topic.toLowerCase()], que.text, que.score];
      let options = que.options;



      try {
        let [questionInsertResult] = await con.query(insertQuestionSql, [questionSqlParam]);


        let questionInsertedId = questionInsertResult.insertId;
        options.forEach(async (option, index) => {
          let isAns = false;
          if (index + 1 === que.correctId) isAns = true;
          let optionSqlParam = [questionInsertedId, option, isAns];
          let [optionInsertResult] = await con.query(insertOptionSql, [optionSqlParam]);
        });


      } catch (error) {
        console.log(error);
      }


    });

    //updating exam status to active after questions added
    let updateExamStatusSQL = `UPDATE  exam_details SET exam_status = ? WHERE id = ?;`
    let [updateExamStatusResult] = await con.query(updateExamStatusSQL, [1, examId]);



    res.json({ success: 1 })


    //generating questions pdf,csv for future downloads
    let token = req.cookies.token;
    await generateQuestionsPdfByExamId(examId, token)
    await generateQuestionsCSVByExamId(examId);
  } catch (error) {
    console.log(error);
    logger.error(error)
  }
}

module.exports = { insertQuestionsController, getDifficulties, getTopics, getExamMarksFromExamTable, getExamTotalMarksFromQuestionsTable }