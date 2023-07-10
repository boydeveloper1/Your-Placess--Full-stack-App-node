// Basic express setup
const express = require("express");
const app = express();
const port = 5000;
const mongoose = require("mongoose");

// file system - for images or files
const fs = require("fs");

const path = require("path");

const ExpressError = require("./utilities/ExpressError");

const bodyParser = require("body-parser");

const usersRoutes = require("./routes/users");

const placesRoutes = require("./routes/places");

const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mern-stack.gl9fela.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// Connecting To our Mongoose database with different options embedded
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Displaying Errors just like try and catch
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
  console.log("Database Connected");
});

// This will help extract req.body from the url to express
app.use(bodyParser.json());

// for our images route - to get images to the frontend
app.use("/uploads/images", express.static(path.join("uploads", "images")));

// this middleware adds a header to all responses before it then hits the specific route - this allows our front end to acknowledge reciept of the response from another server. "localhost:5000"
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// All places routes hit this middleware
app.use("/api/places", placesRoutes);

// All users routes hit this middleware
app.use("/api/users", usersRoutes);

// Every Wrong or Undefined path passes this route and moves to the next err handler - Middleware
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// Main Custom Error Handler - Middleware
app.use((err, req, res, next) => {
  // to rolback or delete images from a user that had an error during sign up
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  const { status = 500, message = "Error Encountered" } = err;
  if (res.headerSent) {
    return next(err);
  }
  res.status(status).json({ message: err.message || message });
});

const workingPort = process.env.PORT || port;

// Confirmation of Express Listening to Server. End of Exporess connection
app.listen(workingPort, () => {
  console.log(`Serving at Port https://localhost:${workingPort}`);
});
