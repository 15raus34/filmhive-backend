const mongoose = require("mongoose");

const actorSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    about: {
        type: String,
        trim: true,
        required: true
    },
    gender: {
        type: String,
        trim: true,
        required: true
    },
    avatar: {
        type: Object,
        url: String,
        public_id: String
    }
}, { timestamps: true });

actorSchema.index({ name: "text" })

const Actor = mongoose.model("Actor", actorSchema);

module.exports = Actor;