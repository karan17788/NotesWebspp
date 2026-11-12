const express = require("express");
const mongoose = require("mongoose");
const { noteModel } = require("../model/note.model");

const noteRouter = express.Router();
const categories = ["Personal", "Study", "Work", "Ideas"];

function toClientNote(note) {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    color: note.color,
    category: note.category,
    pinned: note.pinned,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  };
}

function validateNote(input) {
  return input &&
    typeof input.title === "string" &&
    input.title.trim().length <= 100 &&
    typeof input.content === "string" &&
    typeof input.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(input.color) &&
    categories.includes(input.category || "Personal") &&
    (input.pinned === undefined || typeof input.pinned === "boolean");
}

function noteFields(input) {
  return {
    title: input.title.trim() || "Untitled note",
    content: input.content,
    color: input.color,
    category: input.category || "Personal",
    pinned: input.pinned === true,
  };
}

noteRouter.get("/", async (req, res) => {
  try {
    const notes = await noteModel.find({ user: req.userId }).sort({ updatedAt: -1 });
    res.json(notes.map(toClientNote));
  } catch (error) {
    console.error("Could not load notes:", error);
    res.status(500).json({ msg: "Could not load notes" });
  }
});

noteRouter.post("/import", async (req, res) => {
  const { notes } = req.body;
  if (!Array.isArray(notes) || notes.length > 100 || !notes.every(validateNote)) {
    return res.status(400).json({ msg: "Invalid notes import" });
  }

  try {
    let savedNotes = await noteModel.find({ user: req.userId }).sort({ updatedAt: -1 });
    if (savedNotes.length === 0 && notes.length > 0) {
      savedNotes = await noteModel.insertMany(
        notes.map((note) => ({ ...noteFields(note), user: req.userId }))
      );
      savedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    res.json(savedNotes.map(toClientNote));
  } catch (error) {
    console.error("Could not import notes:", error);
    res.status(500).json({ msg: "Could not import notes" });
  }
});

noteRouter.post("/", async (req, res) => {
  if (!validateNote(req.body)) {
    return res.status(400).json({ msg: "Invalid note" });
  }

  try {
    const note = await noteModel.create({
      ...noteFields(req.body),
      user: req.userId,
    });
    res.status(201).json(toClientNote(note));
  } catch (error) {
    console.error("Could not save note:", error);
    res.status(500).json({ msg: "Could not save note" });
  }
});

noteRouter.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !validateNote(req.body)) {
    return res.status(400).json({ msg: "Invalid note" });
  }

  try {
    const note = await noteModel.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      noteFields(req.body),
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(toClientNote(note));
  } catch (error) {
    console.error("Could not update note:", error);
    res.status(500).json({ msg: "Could not update note" });
  }
});

noteRouter.patch("/:id/pin", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid note id" });
  }

  try {
    const note = await noteModel.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ msg: "Note not found" });
    note.pinned = !note.pinned;
    await note.save();
    res.json(toClientNote(note));
  } catch (error) {
    console.error("Could not update note pin:", error);
    res.status(500).json({ msg: "Could not update note" });
  }
});

noteRouter.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid note id" });
  }

  try {
    const note = await noteModel.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.status(204).end();
  } catch (error) {
    console.error("Could not delete note:", error);
    res.status(500).json({ msg: "Could not delete note" });
  }
});

module.exports = { noteRouter };
