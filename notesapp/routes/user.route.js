const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");

const userRouter = express.Router();
const jwtSecret = process.env.JWT_SECRET || "coding";

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    bcrypt.hash(password, 5, async (err, hash) => {
      // Store hash in your password DB.
      if (hash) {
        const user = new userModel({ name, email, password: hash });
        await user.save();
        res.send("User Registered successfully");
      }
    });
  } catch (error) {
    res.send("Can't Registered successfully");
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email: email?.trim().toLowerCase() });
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
