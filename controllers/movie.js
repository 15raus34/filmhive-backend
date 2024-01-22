const { isValidObjectId } = require("mongoose");
const cloudinary = require("../cloud");
const { userError } = require("../utils/userErrorHandle");
const Movie = require("../models/movie");
const {
  formatActor,
  relatedMovieAggregation,
  getAverageRatings,
  topRatedMoviesPipeline,
} = require("../utils/helper");
const Review = require("../models/review");

exports.uploadTrailer = async (req, res) => {
  const { file } = req;
  if (!file) return userError(res, "Trailer is Missing");
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      resource_type: "video",
    }
  );
  res.status(201).json({ url, public_id });
};

exports.createMovie = async (req, res) => {
  const { body, file } = req;
  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    reviews,
    language,
  } = body;

  let newMovie = new Movie({
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    reviews,
    language,
  });

  if (director) {
    if (!isValidObjectId(director)) {
      return userError(res, "Invalid Director ID");
    }
    newMovie.director = director;
  }

  if (writers) {
    for (let writer of writers) {
      if (!isValidObjectId(writer)) return userError(res, "Invalid Writer ID");
    }
    newMovie.writers = writers;
  }
  if (file) {
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const poster = { url, public_id, responsive: [] };

    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        // const { secure_url } = imgObj;
        poster.responsive.push(imgObj.secure_url);
      }
    }
    newMovie.poster = poster;
  }
  await newMovie.save();
  res.status(201).json({
    movie: { id: newMovie._id, title },
  });
};

exports.updateWithoutPoster = async (req, res) => {
  const { movieId } = req.params;
  if (!movieId) return userError(res, "Movie Id is Missing!");

  if (!isValidObjectId(movieId)) return userError(res, "Movie Id is invalid!");

  const movie = await Movie.findById(movieId);

  if (!movie) return userError(res, "Movie not available in Database");

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    reviews,
    language,
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.reviews = reviews;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director)) {
      return userError(res, "Invalid Director ID");
    }
    movie.director = director;
  }

  if (writers) {
    for (let writer of writers) {
      if (!isValidObjectId(writer)) return userError(res, "Invalid Writer ID");
    }
    movie.writers = writers;
  }
  await movie.save();
  res.json({ message: "Movie is Updated" });
};

exports.updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { body, file } = req;
  if (!movieId) return userError(res, "Movie Id is Missing!");

  if (!isValidObjectId(movieId)) return userError(res, "Movie Id is invalid!");

  const movie = await Movie.findById(movieId);

  if (!movie) return userError(res, "Movie not available in Database");

  // if (!file) return userError(res, "New Poster is Missing!!");

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    reviews,
    language,
  } = body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.reviews = reviews;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director)) {
      return userError(res, "Invalid Director ID");
    }
    movie.director = director;
  }

  if (writers) {
    for (let writer of writers) {
      if (!isValidObjectId(writer)) return userError(res, "Invalid Writer ID");
    }
    movie.writers = writers;
  }

  if (file) {
    const poster_id = movie.poster?.public_id;
    if (poster_id) {
      const { result } = await cloudinary.uploader.destroy(poster_id);
      if (result !== "ok")
        return userError(res, "Couldn't Update Poster at the moment!");
    }

    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });
    const poster = { url, public_id, responsive: [] };

    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        poster.responsive.push(secure_url);
      }
    }

    movie.poster = poster;
  }

  await movie.save();
  res.json({
    message: "Movie is Updated",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

exports.deleteMovie = async (req, res) => {
  const { movieId } = req.params;
  if (!movieId) return userError(res, "Movie Id is Missing!");

  if (!isValidObjectId(movieId)) return userError(res, "Movie Id is invalid!");

  const movie = await Movie.findById(movieId);

  if (!movie) return userError(res, "Movie not available in Database");

  const poster_id = movie.poster?.public_id;
  if (poster_id) {
    const { result } = await cloudinary.uploader.destroy(poster_id);
    if (result !== "ok")
      return userError(res, "Couldn't Update Poster at the moment!");
  }

  const trailer_id = movie.trailer?.public_id;
  if (!trailer_id) return userError(res, "Couldn't find trailer in the cloud");
  const { result } = await cloudinary.uploader.destroy(trailer_id, {
    resource_type: "video",
  });
  if (result !== "ok")
    return userError(res, "Couldn't find trailer in the cloud");

  await Movie.findByIdAndDelete(movieId);
  res.json({ message: "Movie is Deleted" });
};

exports.getMovies = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query;

  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const results = movies.map((movie) => ({
    id: movie._id,
    title: movie.title,
    poster: movie.poster?.url,
    responsivePosters: movie.poster?.responsive,
    genres: movie.genres,
    status: movie.status,
  }));

  res.json({ movies: results });
};

exports.getMovieForUpdate = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return userError(res, "Invalid Id");
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  res.json({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster?.url,
      releaseDate: movie.releaseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director),
      writers: movie.writers.map((w) => formatActor(w)),
      cast: movie.cast.map((c) => {
        return {
          id: c.id,
          profile: formatActor(c.actor),
          leadActor: c.leadActor,
          roleAs: c.roleAs,
        };
      }),
    },
  });
};

exports.searchMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return userError(res, "Invalid Request!");
  const result = await Movie.find({
    title: { $regex: title, $options: "i" },
  });

  const movies = result.map((movie) => {
    return {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    };
  });

  res.json({ results: movies });
};

exports.getLatestUploads = async (req, res) => {
  const { limit = 5 } = req.query;

  const results = await Movie.find({ status: "public" })
    .sort("-createdAt")
    .limit(parseInt(limit));
  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.poster.responsive,
      trailer: m.trailer?.url,
    };
  });

  res.json({ movies });
};

exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return userError(res, "Invalid Movie ID!!");

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  // const [aggregatedResponse] = await Review.aggregate(
  //   averageRatingPipeline(movie._id)
  // );
  // const reviews = {};

  // if (aggregatedResponse) {
  //   const { ratingAvg, reviewCount } = aggregatedResponse;
  //   reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
  //   reviews.reviewCount = reviewCount;
  // }

  const reviews = await getAverageRatings(movie._id);

  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releaseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;

  res.json({
    movie: {
      id,
      title,
      storyLine,
      releaseDate,
      genres,
      tags,
      language,
      cast: cast.map((c) => ({
        id: c._id,
        profile: {
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor?.avatar?.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        id: w._id,
        name: w.name,
      })),
      director: {
        id: director._id,
        name: director.name,
      },
      poster: poster?.url,
      trailer: trailer?.url,
      type,
      reviews: { ...reviews },
    },
  });
};

exports.getRelatedMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) return userError(res, "Invalid Movie ID!!");

  const movie = await Movie.findById(movieId);

  const movies = await Movie.aggregate(
    relatedMovieAggregation(movie.tags, movie._id)
  );

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);

    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const relatedMovies = await Promise.all(movies.map(mapMovies));
  res.json({ movies: relatedMovies });
};

exports.getTopRelatedMovie = async (req, res) => {
  const { type = "Film" } = req.query;

  const movies = await Movie.aggregate(topRatedMoviesPipeline(type));

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };

  const topRatedMovies = await Promise.all(movies.map(mapMovies));
  res.json({ movies: topRatedMovies });
};

exports.searchPublicMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return userError(res, "Invalid Request!");
  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsivePosters,
      reviews: { ...reviews },
    };
  };

  const results = await Promise.all(movies.map(mapMovies));

  res.json({ results });
};
