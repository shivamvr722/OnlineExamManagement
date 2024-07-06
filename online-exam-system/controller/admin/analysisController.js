const con = require('../../config/dbConnection');
const { logger } = require('../../utils/pino');

const analysisPageContoller = async(req,res)=>{
  try{
    let rolesSql = `select id from roles where role="Student"`;
    let [roles] = await con.query(rolesSql);
    const examTopicsCount = `select count(*) as total_topics from exam_topics where is_deleted=0`;
    let studentCount = `select count(*) as total_students from users where role_id=${roles[0].id}`
    let examCount = `select count(*) as total_exams from exam_details where exam_status=1 and isDeleted=0`;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
    let questionsTopicsCount = `select exam_topics.topic , count(exam_topics.topic) as count from exam_topics join questions on exam_topics.id = questions.topic_id where exam_topics.is_deleted=0 group by exam_topics.id;`
    let questionsDifficultyCount = `select difficulty_levels.difficulty, count(difficulty_levels.difficulty) as count from difficulty_levels join questions on difficulty_levels.id = questions.difficulty_id group by difficulty_levels.id;`;
    
    let passingStudetnsSql = `select exam_details.title, exam_details.passing_marks, count(results.marks) as passing_students from exam_details join results on exam_details.id = results.exam_id  where results.marks>exam_details.passing_marks group by exam_details.id;`;
    
    let [topicsResult] = await con.query(examTopicsCount);
    let [studentResult] = await con.query(studentCount);
    let [examResult] = await con.query(examCount);
    let [questionstTopicsResult] = await con.query(questionsTopicsCount);
    let [passingStudentsResult] = await con.query(passingStudetnsSql);
    let [questionsDifficultyResult] = await con.query(questionsDifficultyCount);
    
    res.render('admin/analysis.ejs',{topic:topicsResult[0].total_topics, students:studentResult[0].total_students, exams:examResult[0].total_exams,questionsTopics:questionstTopicsResult,passingStudents:passingStudentsResult,id:req.user.id,questionsDifficulty:questionsDifficultyResult});
  }catch(err){
    console.log(err.message);
  }
}

module.exports = {analysisPageContoller};