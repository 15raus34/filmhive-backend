const { isValidObjectId } = require("mongoose");
const passwordToken = require("../models/passwordResetToken");
const User = require("../models/User");
const UserVerifing = require("../models/UserVerification");
const {
  generateOPT,
  trasporter,
  generateRandomBuff,
} = require("../utils/helper");
const { userError } = require("../utils/userErrorHandle");
const jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;

  const isExistingUser = await User.findOne({ email });

  if (isExistingUser) {
    return userError(res, "User Already Exist");
  }
  const newUser = new User({ name, email, password });

  await newUser.save();

  let OTP = generateOPT();

  const verifyingUser = new UserVerifing({ owner: newUser._id, token: OTP });
  await verifyingUser.save();

  var transport = trasporter();

  transport.sendMail({
    from: "raus@reviewmovie.com",
    to: newUser.email,
    subject: "User Verification",
    html: `
            Your OTP is ${OTP}
        `,
  });
  res.status(201).json({
    user: {
      userID: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyUserFromOTP = async (req, res) => {
  const { UserID, OTP } = req.body;

  if (!isValidObjectId(UserID)) {
    return userError(res, "User Doesn't Exist Invalid User");
  }

  const isExistingUser = await User.findOne({ _id: UserID });
  if (!isExistingUser) {
    return userError(res, "User Doesn't Exist");
  }

  if (isExistingUser.isVerified) {
    return userError(res, "User Is Already Verified");
  }

  const token = await UserVerifing.findOne({ owner: UserID });
  if (!token) {
    return userError(res, "Token Doesn't Exist");
  }

  const isValidToken = await token.compareToken(OTP);
  if (!isValidToken) {
    return userError(res, "Invalid Token");
  }

  isExistingUser.isVerified = true;
  await isExistingUser.save();

  await UserVerifing.findByIdAndDelete(token._id);
  const jwtoken = jwt.sign(
    { userID: isExistingUser._id },
    process.env.JWTOKEN_SECRET
  );

  res.json({
    user: {
      userID: isExistingUser._id,
      name: isExistingUser.name,
      email: isExistingUser.email,
      token: jwtoken,
      isVerified: isExistingUser.isVerified,
      role: isExistingUser.role,
    },
    Mesg: "You Are Vefified",
  });
};

exports.resendOTP = async (req, res) => {
  const { UserID } = req.body;
  if (!isValidObjectId(UserID)) {
    return userError(res, "User Doesn't Exist Invalid User");
  }

  const isExistingUser = await User.findOne({ _id: UserID });
  if (!isExistingUser) {
    return userError(res, "User Doesn't Exist");
  }

  if (isExistingUser.isVerified) {
    return userError(res, "User Is Already Verified");
  }

  const token = await UserVerifing.findOne({ owner: UserID });
  if (token) {
    return userError(
      res,
      "Token Already Exist Please Request Again After 1 Hour"
    );
  }

  let OTP = "";

  for (let i = 0; i < 6; i++) {
    const Value = Math.round(Math.random() * 9);
    OTP += Value;
  }

  const verifyingUser = new UserVerifing({
    owner: isExistingUser._id,
    token: OTP,
  });
  await verifyingUser.save();

  var transport = trasporter();

  transport.sendMail({
    from: "raus@reviewmovie.com",
    to: isExistingUser.email,
    subject: "User Verification Resent",
    html: `
            Your OTP is ${OTP}
        `,
  });

  res.json({ Mesg: "OPT HAS BEEN SENT TO YOUR MAIL AGAIN" });
};

exports.passwordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return userError(res, "Please Provide a Email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return userError(res, "User Doesn't Exist");
  }
  const HasTokenAlready = await passwordToken.findOne({ owner: user._id });
  if (HasTokenAlready) {
    return userError(res, "Reset Link Already Exist Please Check Your Mail");
  }
  const randomByte = await generateRandomBuff();

  const newUserRandomByte = new passwordToken({
    owner: user._id,
    token: randomByte,
  });
  await newUserRandomByte.save();

  const resetLink = `http://localhost:3000/auth/reset-password?token=${randomByte}&user=${user._id}`;

  var transport = trasporter();

  transport.sendMail({
    from: "raus@reviewmovie.com",
    to: user.email,
    subject: "User Verification Resent",
    html: `
        <a href=${resetLink}>Reset Password</a>
        `,
  });
  res.json({ Mesg: "Link Sent To Your Mail." });
};

exports.validateResetToken = async (req, res) => {
  res.send({ valid: true });
};

exports.resetPassword = async (req, res) => {
  const { newPassword, userID } = req.body;

  const user = await User.findById(userID);
  if (!user) {
    return userError(res, "User Doesn't Exist");
  }
  const oldNewPasswordMatch = await user.comparePassword(newPassword);
  if (oldNewPasswordMatch) {
    return userError(res, "Old Password Can't Be New Password");
  }
  user.password = newPassword;

  await passwordToken.findByIdAndDelete(req.resetToken._id);
  await user.save();
  res.send({ message: "Password Has Been Reset" });
};

exports.signInUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return userError(res, "User Doesn't Exist");
  }
  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return userError(res, "Password Didn't Matched");
  }

  const { _id, name, isVerified, role } = user;
  const jwtoken = jwt.sign({ userID: _id }, process.env.JWTOKEN_SECRET);

  res.json({
    user: { name, email, id: _id, loginToken: jwtoken, isVerified, role },
  });
};
