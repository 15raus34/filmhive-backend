const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  parentMovie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    require: true,
  },
  content: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    require: true,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
