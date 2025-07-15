const jwt = require("jsonwebtoken");
const config = require("config");

const auth = (req, res, next) => {
  // get the token from the header
  const authHeader = req.headers["authorization"];

  // split the auth header and get the token
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Denied access: Access token not found",
    });
  }

  //   verify the token
  jwt.verify(token, config.get("jwtSecret"), (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Denied access: Invalid token",
      });
    }
    // This expression below is the payload and dont bring the password or any other env properties into this object
    req.user = user; 
    // pass to the next malware
    next();
  });
};

module.exports = auth;