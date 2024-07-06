const express = require("express");
const app = express();
const ejs = require("ejs");
var cookieParser = require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let passport = require("passport");
const { passportAuth } = require("./middlewares/auth");
passportAuth(passport);

const dotenv = require("dotenv").config(); //to config the env for all the routes
const port = process.env.PORT;
app.set("view engine", "ejs");
app.use(express.static("public"));

//bootstrap css and js (npm installed)
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
// //  <link rel="stylesheet" href="/css/bootstrap.min.css" />
//use above link to bootsrap css

app.use(
  "/sweetalert2",
  express.static(__dirname + "/node_modules/sweetalert2/dist")
);

// export result route
const exportResult = require("./routes/user/exportResult");
app.use("/user", exportResult); // don't change this route location

//admin routes

//IMPORTANT : use both exports route on top of every route
const exportExamRoute = require("./routes/admin/exportRoute");
app.use("/admin/exams", exportExamRoute);

const dashboardRouter = require("./routes/admin/dashboardRoute");
app.use("/admin", dashboardRouter);

const studentsRouter = require("./routes/admin/StudentsRoute");
app.use("/admin/students", studentsRouter);

const examsRouter = require("./routes/admin/ExamsRoute");
app.use("/admin/exams", examsRouter);

//users routes
const usersProfile = require("./routes/user/userProfile");
app.use("/user", usersProfile);

//student exams route
const examRoute = require("./routes/user/examRoute");
app.use("/exam", examRoute);

// user answer key
const UserAnswerKeyReview = require("./routes/user/userAnswerKey");
app.use("/user/useranswerkey", UserAnswerKeyReview);

// authenticator
const authenticationRouter = require("./routes/authentication/authenticationRoute");
app.use("/", authenticationRouter);

//User Feedback
const userFeedbackRoute = require("./routes/user/userFeedbackRoute");
app.use("/user/userFeedback", userFeedbackRoute);

//----PAGE NOT FOUND 404 ERROR----
app.use((req, res, next) => {
  res.status(404).render("errorPage404");
});

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}.`);
});

//SOCKET.IO
const io = require("socket.io")(server);

const {notifyUser} = require('./controller/admin/examNotify');


io.on("connection", async (socket) => {

  console.log("connected to socket.io");

  socket.on("send feedback", (databody) => {

    io.emit("send feedback", databody);

    io.emit("receive feedback");
  });
  
  socket.on("send notifications",async(data)=>{
    if(data){
      const result = await notifyUser();
      io.emit('notifications', result);
    }
  })
});
