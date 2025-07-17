const express = require("express");
const cors = require("cors");
const app = express();
const config = require("config");
const port = config.get("PORT") || 8000;

console.log(config.get("Appname"));

// body parser
app.use(express.json());

const allowedOrigins = [
  "http://localhost:8000",
  "https://todo-app-frontend-sable-theta.vercel.app/",
];
app.use(
  cors()
);

// import route files
const error = require("./middleware/error");
const user = require("./routes/user");
const profile = require("./routes/profile");
const todo = require("./routes/todo");
const auth = require("./routes/auth");
const path = require("path");
const wallet = require("./routes/wallet");

// main routes
app.use("/user", user);
app.use("/profile", profile);
app.use("/todo", todo);
app.use("/auth", auth);
app.use("/wallet", wallet);

// Serve avatar images statically
app.use(
  "/public/avatar",
  express.static(path.join(__dirname, "public/avatar"))
);

// error handler middleware
app.use(error);

// Start server
app.listen(port, () =>
  console.log(`Todo app listening at http://localhost:${port}`)
);

module.exports = app;
