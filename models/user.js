const mongoose = require("mongoose");

// for a unique email
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  image: {
    url: { type: String, required: true },
    filename: { type: String },
  },
  // Associating a place model to the user model using reference Id
  // it is put ion an array to signify multi places can be owned by a user
  places: [{ type: Schema.Types.ObjectId, required: true, ref: "Place" }],
});

UserSchema.plugin(uniqueValidator);

const User = mongoose.model("User", UserSchema);
module.exports = User;
