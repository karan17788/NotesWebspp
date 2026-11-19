const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeMongoUri } = require("../config/mongo-uri");

test("keeps a valid MongoDB URI unchanged", () => {
  const uri = "mongodb+srv://cluster.example/notely";
  assert.equal(normalizeMongoUri(uri), uri);
});

test("normalizes a quoted .env assignment copied into a hosting variable", () => {
  const uri = "mongodb+srv://cluster.example/notely";
  assert.equal(normalizeMongoUri(` MONGO_URI = "${uri}" `), uri);
});

test("rejects values that are not MongoDB URIs", () => {
  assert.throws(() => normalizeMongoUri("not-a-mongodb-uri"), /must contain only the MongoDB URI/);
  assert.throws(() => normalizeMongoUri("  "), /MONGO_URI is not set/);
});
