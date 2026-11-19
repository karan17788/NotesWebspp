const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || !jwtSecret.trim()) {
  throw new Error("JWT_SECRET is not set. Add a secure secret to the environment.");
}

module.exports = { jwtSecret };
