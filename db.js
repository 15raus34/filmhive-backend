const mongoose = require("mongoose");

// Optional configuration options for the database connection
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const mongoDB = mongoose
  .connect(process.env.MONGO_URI, options)
  .then(() => {
    console.log("Connected to MongoDB database");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB database:", error);
  });

module.exports = mongoDB;
