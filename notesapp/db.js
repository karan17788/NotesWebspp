const mongoose = require("mongoose");

require("dotenv").config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI is not set. Add it to the .env file.");
}

const connection = mongoose.connect(mongoUri);

module.exports = { connection };
