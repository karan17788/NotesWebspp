const express = require("express");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./middlewere/auth.middlewere");
const { noteModel } = require("./model/note.model");

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin);

app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ msg: "Origin is not allowed" });
  }
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/user", userRouter);
app.use("/notes", auth, noteRouter);

app.get("/", (req, res) => {
  res.send("HOME Page");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(auth);
app.get("/dashboard", (req, res) => {
  res.send("Private Route");
});

async function startServer() {
  await connection;
  await noteModel.createCollection();
  console.log("DB Connected");

  const port = process.env.PORT || 8080;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Server could not start:", error);
  process.exit(1);
});
