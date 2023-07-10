const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

// Requiring place controllers
const places = require("../controllers/places");

// const fileUpload = require("../middleware/file-upload");

// For parsing images or files from a form
const multer = require("multer");

const { storage } = require("../cloudinary");

// telling multer to store cloudinary storage
const upload = multer({ storage });

const checkAuth = require("../middleware/authentication");

// Get places associated to a user using the user id (uid)
router.get("/user/:uid", places.getPlacesByUserId);

// Get a specific place by the placeid (pid)
router.get("/:pid", places.getPlaceById);

router.use(checkAuth);

router.post(
  "/",
  upload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  places.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  places.updatePlace
);

router.delete("/:pid", places.deletePlace);

module.exports = router;
