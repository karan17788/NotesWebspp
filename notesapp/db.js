const mongoose = require("mongoose");

require("dotenv").config();

const { normalizeMongoUri } = require("./config/mongo-uri");
const mongoUri = normalizeMongoUri(process.env.MONGO_URI);

const connection = mongoose.connect(mongoUri);

module.exports = { connection };
