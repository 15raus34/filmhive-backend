const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { uploadVideo, uploadImage } = require("../middlewares/multer");
const {
  uploadTrailer,
  createMovie,
  deleteMovie,
  getMovies,
  getMovieForUpdate,
  updateMovie,
  searchMovies,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovie,
  getTopRelatedMovie,
  searchPublicMovies,
} = require("../controllers/movie");
const { parseData } = require("../middlewares/helper");
const {
  validateMovie,
  validate,
  validateTrailer,
} = require("../middlewares/validator");
const router = express.Router();

router.post(
  "/upload-trailer",
  isAuth,
  isAdmin,
  uploadVideo.single("video"),
  uploadTrailer
);

router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validateTrailer,
  validate,
  createMovie
);

// router.patch(
//   "/update-Without-Poster/:movieId",
//   isAuth,
//   isAdmin,
//   validateMovie,
//   validate,
//   updateWithoutPoster
// );

router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validate,
  updateMovie
);

router.delete("/:movieId", isAuth, isAdmin, deleteMovie);
router.get("/movies", isAuth, isAdmin, getMovies);
router.get("/for-update/:movieId", isAuth, isAdmin, getMovieForUpdate);
router.get("/search", isAuth, isAdmin, searchMovies);

// For Normal Users

router.get("/latest-uploads", getLatestUploads);
router.get("/single/:movieId", getSingleMovie);
router.get("/related/:movieId", getRelatedMovie);
router.get("/top-rated", getTopRelatedMovie);
router.get("/search-public", searchPublicMovies);

module.exports = router;
