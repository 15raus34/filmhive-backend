const express = require("express");
const { uploadImage } = require("../middlewares/multer");
const { actorInfoValidate, validate } = require("../middlewares/validator");
const {
  createActor,
  updateActor,
  deleteActor,
  searchActor,
  getLatestActors,
  getSingleActors,
  getActors,
} = require("../controllers/actor");
const { isAuth, isAdmin } = require("../middlewares/auth");

const routes = express.Router();

routes.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"),
  actorInfoValidate,
  validate,
  createActor
);
routes.post(
  "/update/:actorID",
  isAuth,
  isAdmin,
  uploadImage.single("avatar"),
  actorInfoValidate,
  validate,
  updateActor
);
routes.delete("/:actorID", isAuth, isAdmin, deleteActor);
routes.get("/search", isAuth, isAdmin, searchActor);
routes.get("/latest-actors", isAuth, isAdmin, getLatestActors);
routes.get("/actors", isAuth, isAdmin, getActors);
routes.get("/single/:actorID", getSingleActors);

module.exports = routes;
