const { isValidObjectId } = require("mongoose");
const { userError } = require("../utils/userErrorHandle");
const Movie = require("../models/movie");
const Review = require("../models/review");
const { getAverageRatings } = require("../utils/helper");

exports.addReview = async (req, res) => {
  const { movieId } = req.params;
  const { content, rating } = req.body;

  const userId = req.user._id;
  if (!req.user.isVerified)
    return userError(res, "Please Verify Your Account First!");
  if (!isValidObjectId(movieId)) return userError(res, "Invalid Movie");

  const movie = await Movie.findOne({ _id: movieId, status: "public" });
  if (!movie) return userError(res, "Movie Not Found", 404);

  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movieId,
  });

  if (isAlreadyReviewed) return userError(res, "Movie Already Reviewed");

  const newReview = new Review({
    owner: userId,
    parentMovie: movieId,
    content,
    rating,
  });

  movie.reviews.push(newReview._id);
  await movie.save();
  await newReview.save();

  const reviews = await getAverageRatings(movie._id);
  res.json({ message: "Review Added", reviews });
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { content, rating } = req.body;

  const userId = req.user._id;

  if (!isValidObjectId(reviewId)) return userError(res, "Invalid Review ID");
  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return userError(res, "Invalid Review ID", 404);

  review.content = content;
  review.rating = rating;
  await review.save();

  res.json({ message: "Review Has Been Updated" });
};

exports.removeReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(reviewId)) return userError(res, "Invalid Review ID");

  const review = await Review.findOne({ owner: userId, _id: reviewId });

  if (!review) return userError(res, "Invalid Review ID", 404);

  const movie = await Movie.findById(review.parentMovie).select("reviews");
  movie.reviews = movie.reviews.filter((rId) => rId.toString() !== reviewId);
  await Review.findByIdAndDelete(reviewId);
  await movie.save();
  res.json({ message: "Review Removed Successfully" });
};

exports.getReviewsByMovie = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return userError(res, "Invalid Movie");

  const movie = await Movie.findById(movieId)
    .populate({
      path: "reviews",
      populate: {
        path: "owner",
        select: "name",
      },
    })
    .select("reviews title");

  const reviews = movie.reviews.map((r) => {
    const { owner, content, rating, _id: reviewID } = r;
    const { name, _id: ownerId } = owner;
    return {
      id: reviewID,
      owner: {
        id: ownerId,
        name,
      },
      content,
      rating,
    };
  });
  res.json({ movie: { title: movie.title, reviews } });
};
