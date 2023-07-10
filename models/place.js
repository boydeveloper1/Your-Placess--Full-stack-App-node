const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// creation of Campground Schema
const PlaceSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // image: { type: String, required: true },
  image: {
    url: { type: String, required: true },
    filename: { type: String },
  },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  // Associating a user model to the place model using reference Id
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

const Place = mongoose.model("Place", PlaceSchema);
module.exports = Place;
