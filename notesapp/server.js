const express = require("express");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./middlewere/auth.middlewere");
const { noteModel } = require("./model/note.model");

const app = express();
app.use(express.json());

app.use("/user", userRouter);
app.use("/notes", auth, noteRouter);

app.get("/", (req, res) => {
  res.send("HOME Page");
});

app.use(auth);
app.get("/dashboard", (req, res) => {
  res.send("Private Route");
});

async function startServer() {
  await connection;
  await noteModel.createCollection();
  console.log("DB Connected");

  app.listen(8080, () => {
    console.log("Server started");
  });
}

startServer().catch((error) => {
  console.error("Server could not start:", error);
  process.exit(1);
});
