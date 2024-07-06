const jwt = require("jsonwebtoken");
const { logger } = require("../utils/pino");

const exportQueMiddleware = (req, res, next) => {
  try {
    if (!req || !req.query.token) {
      return res.redirect("/")
    }else{
      jwt.verify(req.query.token, process.env.TOKEN_SECRET, function(err, decoded) {
      if(err){
        return res.redirect("/")
      }else{
        next();
      }
    });
    }
  } catch (error) {
    logger.error(error);
    return res.redirect("/")
  }
}
module.exports = { exportQueMiddleware };