const mysql = require("mysql2");
const { logger } = require("../utils/pino");

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dateStrings: true,
   timezone: "+00:00"
})
  .promise()


con.connect().then(() => logger.info("db Connected")).catch((error) => logger.info(error.message))

module.exports = con;