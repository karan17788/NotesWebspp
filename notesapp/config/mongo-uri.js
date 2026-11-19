function normalizeMongoUri(value) {
  const mongoUri = typeof value === "string"
    ? value
      .trim()
      .replace(/^MONGO_URI\s*=\s*/i, "")
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2")
    : "";

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set. Add it to the environment.");
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error("MONGO_URI must contain only the MongoDB URI and start with mongodb:// or mongodb+srv://.");
  }

  return mongoUri;
}

module.exports = { normalizeMongoUri };
