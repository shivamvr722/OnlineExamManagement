require("dotenv").config()
const passport = require("passport");
const { logger } = require("../utils/pino");
const con = require("../config/dbConnection");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const getToken = (req) => {
  const token = req.body.token || req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (token) {
    return token;
  }
}

const opts = {
  jwtFromRequest: getToken,
  secretOrKey: process.env.TOKEN_SECRET
}

const passportAuth = (passport) => {
  passport.use(new JwtStrategy(opts, async (payload, next) => {
    let userid = payload.userid;

    let result;
    try {
      [result] = await con.query(`select * from users where id=?`, [userid])
    } catch (err) {

      return next(err, false);
    }
   
    if (result.length > 0) {
      return next(null, result[0])
    } else {
      return next(null, false)
    }
   
  }))
}

const isAdmin = async (req, res, next) => {
  let userid = req.user.id;

  let sql = `select * from users where id=?`;

  let result;
  try {
    [result] = await con.query(sql, [userid])
  } catch (error) {
    logger.info(error.message)
    next(error, false)
  }

  sql = `select role from roles where id=?`;
  [role] = await con.query(sql, [result[0].role_id])
  if (role[0].role === "Admin") {
    next(null, result[0])
  } else {
    return res.redirect("/auth/login")
  }

}

const isStudent = async (req, res, next) => {
  let userid = req.user.id;

  let sql = `select * from users where id=?`;

  let result;
  try {
    [result] = await con.query(sql, [userid])
  } catch (error) {
    logger.info(error.message)
    next(null, false)
  }

  sql = `select role from roles where id=?`;
  let [role] = await con.query(sql, [result[0].role_id])

  if (role[0].role === "Student") {
    next(null, result[0])
  } else {
    return res.redirect("/auth/login")
  }

}

const hasExamCode = async (req, res, next) => {
  try {


    let examcode = req.cookies.examcode?.code;
    let examid = req.query.exam;

    

    if (examcode === undefined || examid === undefined) {
      res.redirect("/user/userDashboard")
    }

    let sql = `select * from exam_details where id = ? and exam_activation_code=?`;

    let result;
    try {
      [result] = await con.query(sql, [examid, examcode]);
    } catch (error) {
      logger.info(error.message)
    }
    if (result.length === 0) {
      res.redirect("/user/userDashboard")
    } else {
      next()
    }

  } catch (error) {
    logger.info(error.message)
  }

}



module.exports = { passportAuth, isAdmin, isStudent, hasExamCode };
