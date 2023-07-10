const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

// Requiring users controllers
const users = require("../controllers/users");

// const fileUpload = require("../middleware/file-upload");

// For parsing images or files from a form
const multer = require("multer");

const { storage } = require("../cloudinary");

// telling multer to store cloudinary storage
const upload = multer({ storage });
// Gets all the users
router.get("/", users.getUsers);

// Create a new user
router.post(
  "/signup",
  upload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  users.signup
);

// Login a user
router.post("/login", users.login);

// router.delete("/:pid", places.deletePlace);

module.exports = router;
