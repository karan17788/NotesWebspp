const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
});

const userModel = mongoose.model("user", userSchema);

module.exports = { userModel };
