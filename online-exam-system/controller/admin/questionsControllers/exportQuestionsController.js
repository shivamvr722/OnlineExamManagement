const con = require('../../../config/dbConnection');
const { getTopics, getDifficulties } = require('./insertQuestionsController');
const { logger } = require("../../../utils/pino");
const fs = require("fs");
const { generateQuestionsCSVByExamId, generateQuestionsPdfByExamId } = require('../../../utils/pdfAndCsvGenerator');
const exportQuestionsPageController = async (req, res) => {


  try {
    let examId = req.query.examid;
    if (!examId) {
      res.render("errorPage404");
    }
    let selectQuestionsByExamIdSql = "SELECT * FROM questions  WHERE exam_id = ? and isDeleted=false"

    let [selectQuestionsByExamIdResult] = await con.query(selectQuestionsByExamIdSql, examId);
    if (selectQuestionsByExamIdResult.length === 0) {//this is modified  , no need to do that now 
      return res.json({ message: "exam does not exist or no questions are there " })
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

    // console.log(selectOptionsByQueIdResult);

    let optionsObj = {};
    //optionsObj = {
    //   '1':{ option obj  },
    // '2' : {},..
    // }
    selectQuestionsByExamIdResult.id.forEach(id => {
      optionsObj[id] = selectOptionsByQueIdResult[0].filter(obj => obj.question_id === id);
    });


    // console.log(optionsObj);

    let topics = await getTopics();
    // topics = Object.keys(topics);
    let difficulties = await getDifficulties();

    res.render("admin/exportQuestions", { data: selectQuestionsByExamIdResult, options: optionsObj, topics, difficulties });

  } catch (error) {
    logger.error(error)
  }
}

const exportQuestionsControllerAsPdf = async (req, res) => {
  try {

    const examId = req.query.examid;
    const port = process.env.PORT;
    const token = req.cookies.token || "temp";



    if (!examId) {
      return res.render("errorPage404");//temp
    }

    const examTitleSql = 'select title from exam_details where id=? and isDeleted=0'

    let [examTitle] = await con.query(examTitleSql, examId);

    if (!examTitle || examTitle.length === 0 || !examTitle[0]) {
      return res.render("errorPage404");
    }

    let selectQuestionsByExamIdSql = "SELECT id FROM questions  WHERE exam_id = ? and isDeleted=false"

    let [selectQuestionsByExamIdResult] = await con.query(selectQuestionsByExamIdSql, examId);
    if (selectQuestionsByExamIdResult && selectQuestionsByExamIdResult.length === 0 || (selectQuestionsByExamIdResult[0] && selectQuestionsByExamIdResult[0].length === 0)) {
      return res.render("admin/noQuestionError")
      // return res.json({ success: 0, message: "exam does not exist or no questions are there " })
    }

    examTitle = examTitle[0].title || "test_exam";

    let dirOfPdf = process.env.CONTENT_DIR
    let pathOfPdf = `${dirOfPdf}/questionsPdf/${examId}_${examTitle}.pdf`;
    if (!fs.existsSync(pathOfPdf)) {
      await generateQuestionsPdfByExamId(examId, token);
    }


    res.download(`${dirOfPdf}/questionsPdf/${examId}_${examTitle}.pdf`, `exam_${examTitle}.pdf`);


  } catch (error) {
    logger.error(error);
  }
}
const exportQuestionsControllerAsCSV = async (req, res) => {
  try {
    const examId = parseInt(req.query.examid);
    const token = req.cookies.token;

    if (!examId) return res.render("errorPage404");
    const getExamDetailSQL = "select start_time from exam_details where id=? and isDeleted=0";


    // to check if exam exist and not deleted
    try {
      const [getExamDetailResult] = await con.query(getExamDetailSQL, examId);
      if (!getExamDetailResult || getExamDetailResult.length === 0 || (getExamDetailResult[0] && getExamDetailResult[0].length === 0)) {
        return res.status(404).render('errorPage404')
      }

      let selectQuestionsByExamIdSql = "SELECT id  FROM questions  WHERE exam_id = ? and isDeleted=false"

      let [selectQuestionsByExamIdResult] = await con.query(selectQuestionsByExamIdSql, examId);
      if (selectQuestionsByExamIdResult && selectQuestionsByExamIdResult.length === 0 || (selectQuestionsByExamIdResult[0] && selectQuestionsByExamIdResult[0].length === 0)) {
        return res.render("admin/noQuestionError")
        // return res.json({ success: 0, message: "exam does not exist or no questions are there " })
      }

    } catch (error) {
      logger.error(error);
      return res.status(404).render('errorPage404')
    }

    const examTitleSql = 'select title from exam_details where id=?'

    let [examTitle] = await con.query(examTitleSql, examId);
    examTitle = examTitle[0].title || "test_exam";
    let dirOfCSV = process.env.CONTENT_DIR
    let pathOfCSV = `${dirOfCSV}/questionsCSV/${examId}_${examTitle}.csv`;
    if (!fs.existsSync(pathOfCSV)) {
      await generateQuestionsCSVByExamId(examId, token);
    }


    res.download(`${dirOfCSV}/questionsCSV/${examId}_${examTitle}.csv`, `exam_${examTitle}.csv`);


  } catch (error) {
    logger.error(error);
  }
}


module.exports = { exportQuestionsPageController, exportQuestionsControllerAsPdf, exportQuestionsControllerAsCSV }