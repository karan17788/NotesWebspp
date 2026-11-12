const jwt = require("jsonwebtoken");
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, "coding");
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
