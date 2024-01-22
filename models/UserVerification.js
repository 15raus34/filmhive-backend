const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserVerificationSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true
    },
    expires: {
        type: Date,
        required: true,
        expire: 3600,
        default: Date.now()
    },
});

UserVerificationSchema.pre('save', async function (next) {
    if (this.isModified('token')) {
        this.token = await bcrypt.hash(this.token, 10);
    }
    next();
});

UserVerificationSchema.methods.compareToken = async function (token) {
    const result = bcrypt.compare(token,this.token);
    return result;
}

const UserVerify = mongoose.model('UserVerification', UserVerificationSchema);

module.exports = UserVerify;
