const con = require("../../config/dbConnection");
const generateUniqueId = require("generate-unique-id");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { json } = require("express");
const { logger } = require("../../utils/pino");
const crypto = require("crypto");
require("dotenv").config();

// registration
const registrationController = async (req, res) => {
  try {
    res.render("authentication/registrationPage");
  } catch (error) {
    logger.info(error);
  }
};

const postRegistrationController = async (req, res) => {
  let { fname, lname, email, contactno, dob, password } = req.body;
  const saltRounds = 5;
  let activationCode = crypto.randomBytes(12).toString("hex");
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  try {
    let getUsersSql = `select email,activation_status,token_created_at from users where email = ? `;
    let [result] = await con.query(getUsersSql, [email]);
    if (result.length == 1) {
      if (result[0].activation_status == 0){
        const currentTime = new Date();
        let token_created_at = new Date(result[0].token_created_at);
        let ms = currentTime - token_created_at;
        let expiresIn = 1 * 60 * 60 * 1000;
        if (ms > expiresIn) {
          let deleteUserSql = `delete from  users where email = ?`;
          let deleteUser = await con.query(deleteUserSql, [email]);
        } else {
          return res.json({
            success: false,
            message: "user is already registered",
          });
        }
      } else {
        return res.json({
          success: false,
          message: "user is already registered",
        });
      }
    }
    let rolesSql = `select id from roles where role="Student"`;
    let [roles] = await con.query(rolesSql);
    let insertUserSql = `insert into users(role_id,fname,lname,email,phone_no,dob,password,activation_code)values(?,?,?,?,?,?,?,?)`;
    let insertUser = await con.query(insertUserSql, [
      roles[0].id,
      fname,
      lname,
      email,
      contactno,
      dob,
      hash,
      activationCode,
    ]);
    res.json({
      success: true,
      message: "Succesfully registered",
      activation_code: activationCode,
    });
  } catch (err) {
    console.log(err.message);
  }
};

const registrationLinkController = async (req, res) => {
  try {
    res.render("authentication/activationSuccess");
  } catch (err) {
    console.log(err.message);
  }
};

const registrationVerifyLink = async (req, res) => {
  const activation_code = req.body.activationLink;
  if (activation_code) {
    try {
      const checkActivationSql =
        "select token_created_at,activation_status from users where activation_code = ?";
      const [result] = await con.query(checkActivationSql, [activation_code]);
      if (result.length == 0) {
        res.json({ success: false, message: "Invalid user" });
      } else if (result[0].activation_status == 1) {
        res.json({ success: false, message: "user already activated" });
      } else {
        const currentTime = new Date();
        let token_created_at = new Date(result[0].token_created_at);
        let ms = currentTime - token_created_at;
        let expiresIn = 1 * 60 * 60 * 1000;
        if (ms > expiresIn) {
          res.json({ success: false, message: "activation link expires" });
        } else {
          let activateUser = `update users set activation_status='1' where activation_code=?`;
          let ans = await con.query(activateUser, [activation_code]);
          res.json({success:true});
        }

      }
    } catch (error) {
      res.json({ success: false, message: "something went wrong! :(" });
    }
  } else {
    res.json({
      success: false,
      errorMessage: "empty activation link or email",
    });
  }
};

const loginController = (req, res) => {
  try {
    res.render("authentication/loginPage");
  } catch (err) {
    console.log(err);
  }
};

const checkLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    let sql = `select * from users where email=? and activation_status=1`;
    let result = [];
    try {
      [result] = await con.query(sql, [email]);
    } catch (error) {
      logger.fatal(error.message);
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "email and password not match",
      });
    }

    const hashedpassword = result[0].password;

    const match = await bcrypt.compare(password, hashedpassword);

    if (match) {
      sql = `insert into login_logs (user_id,is_success) values(?,?)`;

      try {
        await con.query(sql, [result[0].id, 1]);
      } catch (error) {
        logger.fatal(error.message);
      }

      let payload = {
        userid: result[0].id,
        name: result[0].fname,
        email: result[0].email,
        roleid: result[0].role_id,
      };
      let token = jwt.sign(payload, process.env.TOKEN_SECRET);

      let {
        password,
        activation_code,
        activation_status,
        token_created_at,
        ...newObj
      } = result[0];

      newObj.token = token;
      sql = `select role from roles where id=?`;
      let [role] = await con.query(sql, [result[0].role_id]);
      let location;

      if (role[0].role === "Admin") {
        location = "/admin";
      } else {
        location = "/user/userDashboard";
      }

      return res
        .cookie("token", token, {
          maxAge: 3 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        })
        .json({ success: true, newObj: newObj, location: location });
    } else {
      sql = `insert into login_logs (user_id,is_success) values (?,?)`;
      try {
        await con.query(sql, [result[0].id, 0]);
      } catch (error) {
        logger.fatal(error.message);
      }
      return res.json({
        success: false,
        message: "email and password not match",
      });
    }
  } catch (error) {
    logger.fatal(error);
  }
};

// forget Password page render
const forgotPasswordController = (req, res) => {
  try {
    res.render("authentication/forgotPasswordPage");
  } catch (err) {
    console.log(err);
  }
};

// email check
function varifyEmail(email) {
  let filter =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return filter.test(email);
}

// varify email and regenerate activationkey
const forgotPasswordVarifyEmail = async (req, res) => {
  try {
    let emailReq = req.body.email;

    if (emailReq.trim() === "") {
      return res.json({ success: false, message: "Please enter email" });
    }
    if (emailReq.trim() !== "" && !varifyEmail(emailReq)) {
      return res.json({ success: false, message: "Enter Valid email" });
    }

    emailReq = emailReq.trim().toLowerCase();

    const sql =
      "SELECT email FROM users WHERE email = ? and activation_status = 1";
    const [result] = await con.query(sql, [emailReq]);

    if (result.length === 0) {
      return res.json({ success: false, message: "user doesn't exists" });
    }

    const activationKey = generateUniqueId({ length: 32 });

    const updateLinkTimeSql =
      "UPDATE users SET activation_code = ?, token_created_at = ? where email = ?";
    await con.query(updateLinkTimeSql, [activationKey, new Date(), emailReq]);
    res.json({
      success: true,
      message: "successful",
      activationKey: activationKey,
    });
  } catch (error) {
    console.log(error);
  }
};

const activationLinkController = (req, res) => {
  try {
    res.render("authentication/activationLinkPage");
  } catch (error) {
    logger.info(error);
  }
};

const forgotPasswordVarifyLink = async (req, res) => {
  const alink = req.body.activeLink;
  if (alink) {
    try {
      const sqlLink =
        "select token_created_at from users where activation_code = ?";
      const [result] = await con.query(sqlLink, [alink]);
      if (result.length === 0) {
        return res.json({ success: false, message: "user doesn't exists" });
      } else {
        const diff = new Date() - new Date(result[0].token_created_at);
        if (diff > 900000) {
          res.json({ success: false, message: "activation link expired" });
        } else {
          res.json({
            success: true,
            message: "user varified",
            activationKey: alink,
          }); // where the finally got the success
        }
      }
    } catch (error) {
      res.json({ success: false, message: "something went wrong! :(" });
    }
  } else {
    res.json({
      success: false,
      errorMessage: "empty activation link or email",
    });
  }
};

const setPasswordController = (req, res) => {
  try {
    res.render("authentication/setPasswordPage");
  } catch (error) {
    logger.info(error);
  }
};

const forgotPasswordNewPassword = async (req, res) => {
  try {
    const aKey = req.body.aKey;
    let password = req.body.password;
    let rePassword = req.body.repassword;
    if (password && rePassword) {
      password = password.trim();
      rePassword = rePassword.trim();
      if (password.length < 8) {
        return res.json({
          success: false,
          message: "password should have atleast 8 character",
        });
      }
      if (password === rePassword) {
        try {
          const saltRounds = 5;
          const salted = bcrypt.genSaltSync(saltRounds);
          const hashPassword = bcrypt.hashSync(password, salted);
          const passSql =
            "update users set password = ? where activation_code = ?";
          const result = await con.query(passSql, [hashPassword, aKey]);
          res.json({ success: true, message: "password updated" });
        } catch (error) {
          res.json({
            success: false,
            message: "error while updating password",
          });
          logger.error(error);
        }
      } else {
        res.json({ success: false, message: "password must be same!" });
      }
    } else {
      res.json({ success: false, message: "password should not be empty" });
    }
  } catch (error) {
    res.json({ success: false, message: "something went wrong!" });
    logger.error(error);
  }
};

// log out
const logout = (req, res) => {
  try {
    res.clearCookie("token").redirect(`http://localhost:${process.env.PORT}/`);
  } catch (error) {
    res.json({ success: false, message: "unable to logout" });
    logger.error(error);
  }
};

const currentUser = async (req, res) => {
  try {
    sql = `select role from roles where id=?`;
    [role] = await con.query(sql, [req.user.role_id]);
    let location;
    if (role[0].role === "Student") {
      location = "/user/userDashboard";
    } else {
      location = "/admin";
    }
    return res.json({ success: true, location: location });
  } catch (error) {
    logger.fatal(error);
  }
};

module.exports = {
  registrationController,
  loginController,
  forgotPasswordController,
  forgotPasswordVarifyEmail,
  activationLinkController,
  forgotPasswordVarifyLink,
  forgotPasswordNewPassword,
  setPasswordController,
  postRegistrationController,
  checkLogin,
  registrationLinkController,
  currentUser,
  logout,
  registrationVerifyLink,
};
