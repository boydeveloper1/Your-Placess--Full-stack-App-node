const { validationResult } = require("express-validator");

//  for hashing password
const bcrypt = require("bcryptjs");

// this generates a token that the server uses to track logged in users
// token will be forwarded to front end and used for routes that require a logged in user
const jwt = require("jsonwebtoken");

const ExpressError = require("../utilities/ExpressError");

// user model
const User = require("../models/user");

let users;
// Gets all the users
const getUsers = async (req, res, next) => {
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new ExpressError(
      "Fetching users failed, please try again later "
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

// Create a new user
const signup = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  let exisitingUser;

  // check if email is associated with a user
  try {
    exisitingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new ExpressError("Signing up Failed, please try again later");
    return next(error);
  }

  if (exisitingUser) {
    const error = new ExpressError("User exists already, please login instead");
    return next(error);
  }

  let hashedpassword;
  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new ExpressError(
      "Could not create user, please try again",
      500
    );
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    image: {
      url: req.file.path,
      filename: req.file.filename,
    },
    password: hashedpassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new ExpressError("Signing up failed, please try again.", 500);
    return next(error);
  }

  // token to track signed in user
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new ExpressError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

// Login a user
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let exisitingUser;

  // check if email is associated with a user
  try {
    exisitingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new ExpressError("Logging in Failed, please try again later");
    return next(error);
  }

  if (!exisitingUser) {
    const error = new ExpressError(
      "Invalid Credentials, could not log you in.",
      403
    );
    return next(error);
  }

  // comparing hashed password in db and password entered by the user - this returns true or false
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, exisitingUser.password);
  } catch (error) {
    const err = new ExpressError(
      "Could not log you in, please check your credentials and try again",
      500
    );
    return next(err);
  }

  // if isValidPassword returns false
  if (!isValidPassword) {
    const error = new ExpressError(
      "Invalid Credentials, could not log you in.",
      401
    );
    return next(error);
  }

  // token to track signed in user
  let token;
  try {
    token = jwt.sign(
      { userId: exisitingUser.id, email: exisitingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new ExpressError("Logging in failed, please try again.", 500);
    return next(error);
  }

  res.json({
    userId: exisitingUser.id,
    email: exisitingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
