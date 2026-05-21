const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  request: {
    type: String,
    required: true,
  },
  board_type: {
    type: String,
    enum: ["general", "course", "fest_club"],
    default: "general",
  },
  course_code: {
    type: String,
    default: null,
  },
  club_name: {
    type: String,
    default: null,
  },
  deadline: {
    type: Date,
    required: true,
  },
  reward: {
    type: String,
    required: true,
  },
  reward_points: {
    type: Number,
    default: null,
  },
  max_reward_points: {
    type: Number,
    default: null,
  },
  bidding_enabled: {
    type: Boolean,
    default: false,
  },
  bids: {
    type: [
      {
        roll_number: String,
        name: String,
        amount: Number,
        created_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  posted_by: {
    type: String,
    required: true,
  },
  posted_by_name: {
    type: String,
    required: true,
  },
  posted_by_role: {
    type: String,
    default: "student",
  },
  accepted_by: {
    type: String,
    default: null,
  },
  accepted_by_name: {
    type: String,
    default: null,
  },
  team_size: {
    type: Number,
    default: 1,
  },
  team_members: {
    type: [
      {
        roll_number: String,
        name: String,
        joined_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  team_open_slots: {
    type: Number,
    default: 0,
  },
  urgent: {
    type: Boolean,
    default: false,
  },
  urgent_expires_at: {
    type: Date,
    default: null,
  },
  anonymous: {
    type: Boolean,
    default: false,
  },
  required_skills: {
    type: [String],
    default: [],
  },
  skill_quiz: {
    enabled: { type: Boolean, default: false },
    questions: {
      type: [
        {
          prompt: String,
          options: [String],
          correct_index: Number,
        },
      ],
      default: [],
    },
  },
  microtask_mode: {
    type: Boolean,
    default: false,
  },
  bundle_mode: {
    type: Boolean,
    default: false,
  },
  microtasks: {
    type: [
      {
        title: String,
        points: Number,
        duration_mins: Number,
        status: { type: String, default: "open" },
        assigned_to: { type: String, default: null },
        assigned_to_name: { type: String, default: null },
        completed_at: { type: Date, default: null },
      },
    ],
    default: [],
  },
  waitlist: {
    type: [
      {
        roll_number: String,
        name: String,
        created_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  reward_confirmations: {
    type: [
      {
        roll_number: String,
        name: String,
        status: {
          type: String,
          enum: ["received", "not_received"],
        },
        created_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  bump_count: {
    type: Number,
    default: 0,
  },
  last_bumped_at: {
    type: Date,
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
  verified_at: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", taskSchema);
