const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const passwordResetSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        required: true,
        expire: 3600,
        default: Date.now()
    },
});

passwordResetSchema.pre('save', async function (next) {
    if (this.isModified('token')) {
        this.token = await bcrypt.hash(this.token, 10);
    }
    next();
});

passwordResetSchema.methods.compareToken = async function (token) {
    const result = bcrypt.compare(token,this.token);
    return result;
}

const passwordToken = mongoose.model('PasswordToken', passwordResetSchema);

module.exports = passwordToken;
