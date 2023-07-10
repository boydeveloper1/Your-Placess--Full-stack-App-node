const fs = require("fs");

// for random id
const uuid = require("uuid").v4;

const { validationResult } = require("express-validator");

const ExpressError = require("../utilities/ExpressError");

const mongoose = require("mongoose");

const { cloudinary } = require("../cloudinary");

// Translates the address the user enters to coordinates
const getCoordsForAddress = require("../utilities/location");

const Place = require("../models/place");

// importing user model because we associated user in the schema(one place must belong to a user)
const User = require("../models/user");

// Get a specific place by the placeid (pid)
const getPlaceById = async (req, res, next) => {
  const { pid } = req.params;
  // where p is each individual place
  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not find a place,",
      500
    );
    return next(error);
  }

  // If place not found / no id matches
  if (!place) {
    const error = new ExpressError(
      "Could not find a place for the provided place id.",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) }); // => {place => (place: place)}
};

// Get places associated to a user using the user id (uid)
const getPlacesByUserId = async (req, res, next) => {
  const { uid } = req.params;

  // finding places based on the user that created it
  let places;
  try {
    places = await Place.find({ creator: uid });
  } catch (err) {
    const error = new ExpressError(
      "Fetching Places Failed, please try again later",
      500
    );
    return next(error);
  }

  // if user not found / no id matches
  if (!places || places.length === 0) {
    return next(
      new ExpressError("Could not find a place for the provided user id.", 404)
    );
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

//When the form for creating a new place is triggered, it passes through this route
const createPlace = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address } = req.body;

  // Handling error in async-await - getCoordsForAddress throws and error if it fails, so this handles it.
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  console.log(req.body);
  console.log(req.file);
  // this creates a new place in the database
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: {
      url: req.file.path,
      filename: req.file.filename,
    },
    // image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  // checking to see if the id of the user exists in our database
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new ExpressError(
      "Creating Place Failed, Please try again",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new ExpressError(
      "Could not find user for the provided id",
      404
    );
    return next(error);
  }

  console.log(user);

  // creating a new place within a session of independent transaction. saving the place and addig the placeid to the user
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });
    // adding the id of createdPlace to the user, mongoose adds just the ID
    user.places.push(createdPlace);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    const err = new ExpressError(
      "Creating place failed, Please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

// The Edited form passes through this route
const updatePlace = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { title, description } = req.body;
  const { pid } = req.params;

  // finding the place we wanna update with the pid
  let place;
  try {
    place = await Place.findById(pid);
  } catch (error) {
    const err = new ExpressError(
      "Something Went Wrong, could not update place",
      500
    );
    return next(error);
  }

  // AUTHORIZATION
  // req.userData.userId was added in the auth middleware
  if (place.creator.toString() !== req.userData.userId) {
    const err = new ExpressError(
      "You are not allowed to edit this placee",
      401
    );
    return next(err);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong could not update place",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// deleting a place passes through this route
const deletePlace = async (req, res, next) => {
  const { pid } = req.params;

  let place;

  try {
    place = await Place.findById(pid).populate("creator");
  } catch (error) {
    const err = new ExpressError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new ExpressError("Could not find place for this id", 404);
    return next(error);
  }

  // AUTHORIZATION
  if (place.creator.id !== req.userData.userId) {
    const err = new ExpressError(
      "You are not allowed to delete this placee",
      401
    );
    return next(err);
  }

  // accessing the image path
  const imagePath = place.image.url;

  // Deleting image from cloudinary after place is deleted
  const filename = place.image.filename;
  cloudinary.uploader.destroy(filename);

  try {
    // deleting a new place from a user within a session of independent transaction. deleting the place from document and remvoing the placeid from the user
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.deleteOne({ session: session });
    // mongoose will remove the ID by just passing in the place "(place)"
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not delete place",
      500
    );
    return next(error);
  }
  // deleting an image from db when the place is deleted
  // fs.unlink(imagePath, (err) => {
  //   console.log(err);
  // });

  res.status(200).json({ message: "Deleted Place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

// function execution stops when we throw errors "throw error" but when we call next(), it doesn't therefore we have to reurn it. return next ( )
