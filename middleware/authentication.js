const ExpressError = require("../utilities/ExpressError");

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    // req.headers.authorization was set in app.js

    const token = req.headers.authorization.split(" ")[1];
    //   if no token
    if (!token) {
      throw new Error("Authentication failed");
    }
    //   verifying if the token is actually valid with the private key
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    //   adding data to "req.userData" - we can add data to the req
    // userid was added to the payload while creating the token, so the decoded token still has that id on it
    req.userData = { userId: decodedToken.userId };
    next();

    //   handling error in the process of getting the token or spliting it
  } catch (err) {
    const error = new ExpressError("Authentication failed!", 403);
    return next(error);
  }
};
