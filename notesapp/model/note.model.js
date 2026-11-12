const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, default: "" },
    color: { type: String, required: true },
    category: {
      type: String,
      enum: ["Personal", "Study", "Work", "Ideas"],
      default: "Personal",
    },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notes" }
);

const noteModel = mongoose.model("Note", noteSchema);

module.exports = { noteModel };
