const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");
const { jwtSecret } = require("../config/jwt");

const userRouter = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function findUserByEmail(email) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return userModel.findOne({ email: new RegExp(`^${escapedEmail}$`, "i") });
}

userRouter.post("/register", async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 100 || !emailPattern.test(email) || password.length < 4) {
    return res.status(400).json({ msg: "Enter a name, valid email, and password of at least 4 characters." });
  }

  try {
    if (await findUserByEmail(email)) {
      return res.status(409).json({ msg: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, 10);
    await userModel.create({ name, email, password: hash });
    res.status(201).send("User Registered successfully");
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ msg: "Registration failed" });
  }
});

userRouter.post("/login", async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required." });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).send("User is not Registered");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).send("Wrong Password");

    const token = jwt.sign({ userId: user._id.toString() }, jwtSecret);
    res.send({ msg: "Login Successfully", token, name: user.name });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).send({ msg: "Login failed" });
  }
});

module.exports = { userRouter };
