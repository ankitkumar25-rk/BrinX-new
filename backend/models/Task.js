const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  request: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  reward: {
    type: String,
    required: true,
  },
  posted_by: {
    type: String,
    required: true,
  },
  posted_by_name: {
    type: String,
    required: true,
  },
  accepted_by: {
    type: String,
    default: null,
  },
  accepted_by_name: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["open", "accepted", "completed", "verified"],
    default: "open",
  },
  file_link: {
    type: String,
    default: null,
  },
  completed_at: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", taskSchema);
