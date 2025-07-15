const express = require("express");
const cors = require("cors");
const app = express();
const config = require("config");
const port = config.get("PORT") || 8000;

console.log(config.get("Appname"));

// body parser
app.use(express.json());
app.use(cors());

// import files to display
const error = require("./middleware/error");
const user = require("./routes/user");
const profile = require("./routes/profile");
const todo = require("./routes/todo");
const auth = require("./routes/auth");
const path = require("path");

// define main routes
app.use("/user", user);
app.use("/profile", profile);
app.use("/todo", todo);
app.use("/auth", auth);
app.use("/avatar", express.static(path.join(__dirname, "public/avatar")));

// app.get("/", (req, res) => {
//     res.send('Hello World!');
// });

app.use(error);

app.listen(port, () =>
  console.log(`Todo app listening at http://localhost:${port}`)
);
