const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  roll_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  escrow_points: {
    type: Number,
    default: 0,
  },
  skills: {
    type: [String],
    default: [],
  },
  courses: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ["student", "professor"],
    default: "student",
  },
  last_active_at: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
