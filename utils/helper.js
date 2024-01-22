const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cloudinary = require("../cloud");
const Review = require("../models/review");

exports.generateOPT = () => {
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    const Value = Math.round(Math.random() * 9);
    OTP += Value;
  }
  return OTP;
};

exports.trasporter = () => {
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASSWORD,
    },
  });
};

exports.generateRandomBuff = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) {
        reject(err);
      }
      const buffString = buff.toString("hex");
      resolve(buffString);
    });
  });
};

exports.uploadAvatarToCloud = async (file_path) => {
  const { public_id, secure_url: url } = await cloudinary.uploader.upload(
    file_path,
    { gravity: "face", height: 150, width: 150, crop: "thumb" }
  );
  return { public_id, url };
};

exports.formatActor = (actor) => {
  const { name, gender, about, _id, avatar } = actor;
  return {
    id: _id,
    name,
    about,
    gender,
    avatar: avatar?.url,
  };
};

exports.averageRatingPipeline = (movieId) => {
  return [
    {
      $lookup: {
        from: "Review",
        localField: "rating",
        foreignField: "_id",
        as: "avgRat",
      },
    },
    {
      $match: { parentMovie: movieId },
    },
    {
      $group: {
        _id: null,
        ratingAvg: {
          $avg: "$rating",
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ];
};

exports.relatedMovieAggregation = (tags, movieId) => {
  return [
    {
      $lookup: {
        from: "Movie",
        localField: "tags",
        foreignField: "_id",
        as: "relatedMovies",
      },
    },
    {
      $match: {
        tags: { $in: [...tags] },
        _id: { $ne: movieId }, //exclude current Movie
      },
    },
    {
      $project: {
        //like map function to take urls
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
      },
    },
    {
      $limit: 5,
    },
  ];
};

exports.getAverageRatings = async (movieId) => {
  const [aggregatedResponse] = await Review.aggregate(
    this.averageRatingPipeline(movieId)
  );
  const reviews = {};

  if (aggregatedResponse) {
    const { ratingAvg, reviewCount } = aggregatedResponse;
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
    reviews.reviewCount = reviewCount;
  }
  return reviews;
};

exports.topRatedMoviesPipeline = (type) => {
  const matchOptions = {
    reviews: { $exists: true },
    status: { $eq: "public" },
  };
  if (type) matchOptions.type = type;
  return [
    {
      $lookup: {
        from: "Movie",
        localField: "reviews",
        foreignField: "_id",
        as: "topRated",
      },
    },
    {
      $match: matchOptions,
    },
    {
      $project: {
        title: 1,
        poster: "$poster.url",
        responsivePosters: "$poster.responsive",
        reviewCount: { $size: "$reviews" },
      },
    },
    {
      $sort: {
        reviewCount: -1,
      },
    },
    {
      $limit: 5,
    },
  ];
};
