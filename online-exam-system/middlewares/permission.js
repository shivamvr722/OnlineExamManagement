const con = require("../config/dbConnection");
const { logger } = require("../utils/pino");


const userHasPermission = async (req, res, next) => {
  try {
    let url = req.baseUrl + req.path;

    url = url.split("/")
    url.shift()

    let id = url.pop()

    let api = "";
    url.forEach(element => {
      api += "/" + element
    });

    if (isNaN(id)) {
      api += "/" + id
    }


    let roleid = req.user.role_id;

    let sql = `SELECT p.permission FROM role_has_permissions as rp  inner join permissions as p on p.id=rp.permission_id where rp.role_id=? and p.permission=?`;

    let result;
    try {
      [result] = await con.query(sql, [roleid, api])
    } catch (error) {
      logger.fatal(error)
    }

    if (result.length !== 0) {
      next()
    } else {
      return res.render("errorPage404")
    }
  } catch (error) {
    logger.fatal(error)
  }

}

module.exports = userHasPermission
