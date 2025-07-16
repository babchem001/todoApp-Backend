const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("config");

const app = express();
const port = config.get("PORT") || 8000;

console.log(config.get("Appname"));

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from avatar folder
app.use("/avatar", express.static(path.join(__dirname, "public/avatar")));

// Routes
const error = require("./middleware/error");
const user = require("./routes/user");
const profile = require("./routes/profile");
const todo = require("./routes/todo");
const auth = require("./routes/auth");

app.use("/user", user);
app.use("/profile", profile);
app.use("/todo", todo);
app.use("/auth", auth);

// Error handler
app.use(error);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
