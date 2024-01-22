const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },
    role: {
        type: String,
        require: true,
        default: "user",
        enum: ["user", "actor"]
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    // next();
});

userSchema.methods.comparePassword = async function (newPassword) {
    const result = bcrypt.compare(newPassword, this.password);
    return result;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
