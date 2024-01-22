const express = require("express");
require("express-async-errors");
const { errorHandle } = require("./middlewares/errrorHandle");
const app = express();
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const userRouter = require("./routes/user");
const actorRouter = require("./routes/actor");
const movieRouter = require("./routes/movie");
const reviewRouter = require("./routes/review");
const adminRouter = require("./routes/admin");

const { handleNotFound } = require("./utils/userErrorHandle");
require("./db");

app.use("/api/user", userRouter);
app.use("/api/actor", actorRouter);
app.use("/api/movie", movieRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin", adminRouter);

app.use("/*", handleNotFound);
app.use(errorHandle);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("Backend Listening in " + PORT);
});
