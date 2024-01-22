const { isValidObjectId } = require("mongoose");
const Actor = require("../models/Actor");
const { userError } = require("../utils/userErrorHandle");
const cloudinary = require("../cloud");
const { uploadAvatarToCloud, formatActor } = require("../utils/helper");

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;

  const newActor = new Actor({ name, about, gender });

  if (file) {
    const { public_id, url } = await uploadAvatarToCloud(file.path);
    newActor.avatar = { public_id, url };
  }
  await newActor.save();
  res.status(201).json({ actor: formatActor(newActor) });
};

exports.updateActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;
  const { actorID } = req.params;

  if (!isValidObjectId(actorID)) return userError(res, "Invalid Actor ID");
  const actor = await Actor.findById(actorID);

  if (!actor) return userError(res, "Actor Doesn't Exist!");

  const public_id = actor.avatar?.public_id;

  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return userError(res, "Couldn't Delete The Actor!!");
    }
  }

  if (file) {
    const { public_id, url } = await uploadAvatarToCloud(file.path);
    actor.avatar = { public_id, url };
  }
  actor.name = name;
  actor.about = about;
  actor.gender = gender;
  await actor.save();
  res.json({ actor: formatActor(actor) });
};

exports.deleteActor = async (req, res) => {
  const { actorID } = req.params;
  if (!isValidObjectId(actorID)) return userError(res, "Invalid Actor ID");

  const actor = await Actor.findById(actorID);

  if (!actor) return userError(res, "Actor Doesn't Exist!");

  const public_id = actor.avatar?.public_id;
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return userError(res, "Couldn't Delete The Actor!!");
    }
  }
  await Actor.findByIdAndDelete(actorID);
  res.json({ message: "Actor Deleted Successfully!!" });
};

exports.searchActor = async (req, res) => {
  const { name } = req.query;
  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
  if (!name) return userError(res, "Invalid Request!");
  const result = await Actor.find({
    name: { $regex: name, $options: "i" },
  });

  const actors = result.map((actor) => formatActor(actor));

  res.json({ results: actors });
};

exports.getLatestActors = async (req, res) => {
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);
  res.json(result);
};

exports.getSingleActors = async (req, res) => {
  const { actorID } = req.params;
  if (!isValidObjectId(actorID)) return userError(res, "Invalid Actor Id!");

  const actor = await Actor.findById(actorID);
  if (!actor) return userError(res, "Actor Doesn't Exist!!!");

  res.json({ actor: formatActor(actor) });
};

exports.getActors = async (req, res) => {
  const { pageNo, limit } = req.query;

  const actors = await Actor.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const profiles = actors.map((actor) => formatActor(actor));
  res.json({
    profiles,
  });
};
