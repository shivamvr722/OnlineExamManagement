const db = require('../../config/dbConnection');
const notifier = require("node-notifier");
const {logger} =require('../../utils/pino')


const dashboardPageController = async(req, res) => {
  try {

    const query = `select id from roles  where  role =  ?`;  
    let [result] = await db.query(query,['Student']);
    let role_id = result[0].id;

    const query1 = `select count(*) as total_students from users where role_id = ?`;
    const query2 = `select count(*) as total_topics from exam_topics`;
    const query3 = `select count(*) as total_exams from exam_details`;

    let [result1] = await db.query(query1,[role_id]);
    let [result2] = await db.query(query2);
    let [result3] = await db.query(query3);


    let total_students = result1[0].total_students;

    let total_topics =result2[0].total_topics;

    let total_exams = result3[0].total_exams;
    res.render('admin/dashboard',{total_students,total_topics,total_exams,id:req.user.id});

  } catch (error) {
    logger.info(error.message);
  }
}
  
const examTableController = async(req,res) =>{
  try {

    let examStatus = req.body.status;
   
    let query;
    let id = req.user.id;
    if (examStatus == "upcoming") {
      query = `select title,total_marks,passing_marks,start_time,duration_minute,exam_activation_code from exam_details where 
      TIMESTAMPDIFF(MINUTE,start_time,NOW())<1 AND creater_id = ? AND isDeleted = ?`;
    }
    else if(examStatus == "ongoing"){
       query = `select title,total_marks,passing_marks,start_time,duration_minute,exam_activation_code from exam_details where 
       TIMESTAMPDIFF(MINUTE,start_time,NOW())>=0 AND  TIMESTAMPDIFF(MINUTE,start_time,NOW())< duration_minute AND creater_id = ? AND isDeleted = ? `;
    }
    else if(examStatus == "completed"){
      query = `select title,total_marks,passing_marks,start_time,duration_minute,exam_activation_code from exam_details where 
      TIMESTAMPDIFF(MINUTE,start_time,NOW())>= duration_minute AND creater_id = ? AND isDeleted = ?`;
    }
    else{
      query = `select title,total_marks,passing_marks,start_time,duration_minute,exam_activation_code from exam_details where 
      TIMESTAMPDIFF(MINUTE,start_time,NOW())<1 AND creater_id = ? AND isDeleted = ?`;
    }
    
    
    let [result] = await db.query(query,[id,0]);
   
    if (result.length == 0) {
      res.json({msg : 'No record found'})
    }else{
      res.json(result);
    }

  } catch (error) {
    logger.info(error.message);
  }
  
}


const  adminProfilePageController = async(req,res) =>{
  try{

    const query_role = `select id from roles  where  role =  ?`;  
    let [result_role] = await db.query(query_role,['Admin']);
    let role_id = result_role[0].id;

    const sql = `select  fname, lname, phone_no, email, dob, address, city, state, zipcode,about from users where role_id = ? and id = ?`;
    const [result] = await db.query(sql, [role_id,req.user.id]);

    let id = req.user.id;
    let full_name = result[0].fname+" "+result[0].lname;
    let phone_no = result[0].phone_no;
    let email = result[0].email;
    let dob = result[0].dob;
    let address = result[0].address;
    let city = result[0].city;
    let state = result[0].state;
    let zipcode = result[0].zipcode;
    let about = result[0].about;

   

      res.render("admin/adminProfile",{id,full_name,phone_no,email,dob,address,city,zipcode,state,about});
  }
  catch(error){
    logger.info(error.message);
  }
}

const adminProfileUpdateController = async(req,res) =>{
  try {
    const query_role = `select id from roles  where  role =  ?`;  
    let [result_role] = await db.query(query_role,['Admin']);
    let role_id = result_role[0].id;

    const sql = `select  fname, lname, phone_no, email, dob, address, city, state, zipcode,about from users where role_id = ? and id = ?`;
    const [result] = await db.query(sql, [role_id,req.user.id]);

    let id = req.user.id;
    let full_name = result[0].fname+" "+result[0].lname;
    let fname = result[0].fname; 
    let lname = result[0].lname;
    let phone_no = result[0].phone_no;
    let email = result[0].email;
    let dob = result[0].dob;
    let address = result[0].address;
    let city = result[0].city;
    let state = result[0].state;
    let zipcode = result[0].zipcode;
    let about = result[0].about;



    res.render("admin/adminProfileUpdate",{id,full_name,fname,lname,phone_no,email,dob,address,city,zipcode,state,about});
   
  } catch (error) {
    logger.info(error.message);
  }
}

const adminProfileUpdatePageController = async(req,res) =>{
  try {
    const id = req.body.id;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const phone_no = req.body.phone_no;
    const email = req.body.email;
    const dob = req.body.dob;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const zipcode = req.body.zipcode;
    const about = req.body.about;

    const query_role = `select id from roles  where  role =  ?`;  
    let [result_role] = await db.query(query_role,['Admin']);
    let role_id = result_role[0].id;

    if (fname && lname && email) {
      const sql = `update users set fname = ?, lname = ?, phone_no = ?, email = ?, dob = ?, address = ?, city = ?, state = ?, zipcode = ? ,about = ? 
      where role_id = ? and id = ?`;
      try{
          const [result] = await db.query(sql, [fname,lname,phone_no,email,dob,address,city,state,zipcode,about,role_id,id]);
          notifier.notify("Profile Updated Successfully");
          res.redirect("/admin/adminProfile");
      } catch (error) {
        logger.info(error.message);
      }
    }
  } catch (error) {
    logger.info(error.message);
  }
}


const adminProfilePhotoUpload = async(req,res) =>{
  try {
    var id = req.body.id;
    var file  = req.file;
    var size  = req.file.size;
    if(id && file){
      if(size < 2097152){
        try {
          
          let updateSql,insertSql,selectSql;
           updateSql = `update user_profile_images set active_profile = ? where user_id = ?`;
          let [updateResult] = await db.query(updateSql, [0, id]);
  
            insertSql = `insert into user_profile_images (user_id, image_path, actual_name, current_name, active_profile) values (?,?,?,?,?)`;
          let [insertResult] = await db.query(insertSql, [id, req.file.path ,req.file.originalname, req.file.filename, 1]);
         
          notifier.notify("Photo Uploaded Successfully!")
          res.json({success:"Success"});
        } catch (error) {
          notifier.notify(`Please upload valid file type '.jpg','.jpeg','.png' and file size size must be less than 2MB`);
          res.json({success:"Fail"});
          logger.info(error.message);
        }
      }
    }
  }
   catch (error) {
    notifier.notify(`Please upload valid file type '.jpg','.jpeg','.png'`);
    res.json({success:"Fail"});
    logger.info(error.message);
  }
}

const path = require("path");
const setPhotoController = async (req, res) => {

  let id = req.params.id;
  let error_path = "public/assets/defaultAdmin.png"

  try{
    const sql = `select image_path from user_profile_images where user_id = ? and active_profile = ?`;
    const [result] = await db.query(sql, [id,1])
   
    if (result == "") {
      res.sendFile(path.join(__dirname,"../../", error_path));
    }
    else{
      let imagePath = result[0].image_path;
      res.sendFile(path.join(__dirname, "../../", imagePath));
    }
   
  } catch (error) {
    logger.info(error.message);
    res.sendFile(path.join(__dirname, "../../", error_path));
  }
}

const removePhotoController = async (req, res) => {

  try{
   
   const updateSQL = `UPDATE user_profile_images SET active_profile = ?  WHERE user_id = ?`;
    let id = req.user.id;
   const [updateResult] = await db.query(updateSQL,[0,id]);
   
   res.json({success:"success"});
   notifier.notify("Photo removed Successfully!");
  } catch (error) {
    logger.info(error.message);
  }
}

module.exports = { dashboardPageController,adminProfilePageController,examTableController ,adminProfileUpdateController,adminProfileUpdatePageController
,adminProfilePhotoUpload,setPhotoController,removePhotoController};
