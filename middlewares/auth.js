const { userError } = require("../utils/userErrorHandle");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.isAuth = async (req, res, next) => {
  const token = req.headers?.authorization;
  if (!token) return userError(res, "UnAuthorized!");
  const jwtToken = token.split("Bearer ")[1];
  if (!jwtToken) return userError("res", "Invalid Token!");
  const decode = jwt.verify(jwtToken, process.env.JWTOKEN_SECRET);
  const { userID } = decode;

  const user = await User.findById(userID);
  if (!user) return userError(res, "Invalid Token User Not Found", 404);

  req.user = user;
  next();
};
exports.isAdmin = (req, res, next) => {
  const { user } = req;
  if (user.role !== "admin")
    userError(res, "Unauthorized Access! Only For Admin");
  next();
};
