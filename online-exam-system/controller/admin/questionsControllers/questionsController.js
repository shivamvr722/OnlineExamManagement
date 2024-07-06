const con = require('../../../config/dbConnection');
const { logger } = require('../../../utils/pino');
const { getTopics, getDifficulties } = require('./insertQuestionsController');

const questionDetailsController = async (req, res) => {
  try {
    let examId = req.body.examId;

    let getQuestionsDetails = "select count(id) as totalQuestions,sum(score) as totalScore from questions where exam_id=? && isDeleted=0"


    let [getQuestionsDetailsResult] = await con.query(getQuestionsDetails, examId);

    let totalQuestions = parseInt(getQuestionsDetailsResult[0].totalQuestions) || 0;
    let totalScore = parseInt(getQuestionsDetailsResult[0].totalScore) || 0;
    res.json({ success: 1, totalQuestions, totalScore });
  } catch (error) {
    console.log(error);
  }
}
const viewQuestionsPageController = async (req, res) => {

  try {


    if (!req.query || !req.query.examid) {
      res.status(404).render('errorPage404')
    }
    const getExamDetailSQL = "select * from exam_details left join users on users.id=exam_details.creater_id where exam_details.id=? AND exam_details.isDeleted=0";

    let examId = req.query.examid;

    let examData = [];
    try {
      examData = await con.query(getExamDetailSQL, examId);
      if (!examData || examData.length === 0 || (examData[0] && examData[0].length === 0)) {
        return res.status(404).render('errorPage404')
      }
    } catch (error) {
      logger.error(error);
      return res.status(404).render('errorPage404')
    }

    examData = examData[0][0]
    // console.log(examData);

    let selectQuestionsByExamIdSql = "SELECT * FROM questions  WHERE exam_id = ? and isDeleted=false"

    let [selectQuestionsByExamIdResult] = await con.query(selectQuestionsByExamIdSql, examId);
    if (selectQuestionsByExamIdResult.length === 0) {
      // return res.json({ success: 0, message: "exam does not exist or no questions are there " })
      return res.render("admin/viewQuestions", { data: { id: [] }, options: {}, topics: {}, difficulties: {}, examId: examId, id: req.user.id, examData });
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

    res.render("admin/viewQuestions", { data: selectQuestionsByExamIdResult, options: optionsObj, topics, difficulties, examId: examId, id: req.user.id, examData });

  } catch (error) {
    logger.error(error.message)
  }
}
module.exports = { questionDetailsController, viewQuestionsPageController }