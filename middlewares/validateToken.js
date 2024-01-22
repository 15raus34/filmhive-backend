const { isValidObjectId } = require("mongoose");
const passwordToken = require("../models/passwordResetToken");
const { userError } = require("../utils/userErrorHandle");

exports.validateToken = async (req,res,next)=>{
    const {token,userID} = req.body;
    if(!token.trim() || !isValidObjectId(userID)){
        return userError(res,"UnAuthorized Access 1");
    }
    const isTokenExisting = await passwordToken.findOne({owner:userID});
    if(!isTokenExisting){
        return userError(res,"Token Doesn't Exist");
    }
    const tokenMatched = await isTokenExisting.compareToken(token);
    if(!tokenMatched) {
        return userError(res,"Token Didn't Matched, Unauthorized");
    }
    req.resetToken = isTokenExisting;
    next();
}