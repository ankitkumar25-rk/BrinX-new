const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

router.get("/preferences", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ roll_number: req.user.roll_number }).select(
      "skills courses role points escrow_points"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      skills: user.skills || [],
      courses: user.courses || [],
      role: user.role,
      points: user.points,
      escrow_points: user.escrow_points,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const { skills, courses } = req.body;

    const update = {
      last_active_at: new Date(),
    };

    if (Array.isArray(skills)) {
      update.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (Array.isArray(courses)) {
      update.courses = courses.map((c) => String(c).trim()).filter(Boolean);
    }

    const user = await User.findOneAndUpdate(
      { roll_number: req.user.roll_number },
      update,
      { new: true }
    ).select("skills courses role points escrow_points");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Preferences updated",
      skills: user.skills,
      courses: user.courses,
      role: user.role,
      points: user.points,
      escrow_points: user.escrow_points,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
