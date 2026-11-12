const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "coding";

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded.userId) {
      return res.status(401).json({ msg: "Please sign in again" });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).send({ msg: "Login First" });
  }
};

module.exports = { auth };
