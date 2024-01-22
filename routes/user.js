const express = require("express");
const {
  createUser,
  verifyUserFromOTP,
  resendOTP,
  passwordReset,
  validateResetToken,
  resetPassword,
  signInUser,
} = require("../controllers/user");
const { validateToken } = require("../middlewares/validateToken");
const {
  validate,
  userValidtor,
  newPasswordValidate,
  userSignInValidtor,
} = require("../middlewares/validator");

const { isAuth } = require("../middlewares/auth");

const routes = express.Router();

routes.post("/create", userValidtor, validate, createUser);
routes.post("/sign-in", userSignInValidtor, validate, signInUser);
routes.post("/verifyOTP", verifyUserFromOTP);
routes.post("/resendOTP", resendOTP);
routes.post("/forget-password", passwordReset);
routes.post("/validate-resetToken", validateToken, validateResetToken);
routes.post(
  "/reset-password",
  newPasswordValidate,
  validate,
  validateToken,
  resetPassword
);

routes.get("/is-auth", isAuth, (req, res) => {
  const { user } = req;
  res.json({
    user: {
      userID: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
    },
  });
});

module.exports = routes;
