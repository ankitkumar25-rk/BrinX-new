const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "backend/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"));
    }
  },
});

router.post("/post-request", authMiddleware, async (req, res) => {
  try {
    const { request, deadline, reward } = req.body;
    const { roll_number, name } = req.user;

    if (!request || !deadline || !reward) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const task = new Task({
      request,
      deadline,
      reward,
      posted_by: roll_number,
      posted_by_name: name,
    });

    await task.save();

    const allUsers = await User.find({ roll_number: { $ne: roll_number } });

    const notifications = allUsers.map((user) => ({
      type: "task_posted",
      sender: roll_number,
      sender_name: name,
      receiver: user.roll_number,
      message: `New Task Posted by ${name}: ${request.substring(
        0,
        50
      )}... Check it out!`,
      task_id: task._id,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: "Task posted successfully",
      task,
    });
  } catch (error) {
    console.error("Post request error:", error);
    res.status(500).json({ message: "Server error while posting task" });
  }
});

router.get("/get-requests", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      status: "open",
      accepted_by: null,
    }).sort({ created_at: -1 });

    const tasksWithPoints = await Promise.all(
      tasks.map(async (task) => {
        const user = await User.findOne({ roll_number: task.posted_by }).select(
          "points"
        );
        return {
          ...task.toObject(),
          posted_by_points: user ? user.points : 0,
        };
      })
    );

    res.json({ tasks: tasksWithPoints });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ message: "Server error fetching tasks" });
  }
});

router.get("/my-posted-tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ posted_by: req.user.roll_number }).sort({
      created_at: -1,
    });

    res.json({ tasks });
  } catch (error) {
    console.error("Get my posted tasks error:", error);
    res.status(500).json({ message: "Server error fetching posted tasks" });
  }
});

router.get("/my-accepted-tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ accepted_by: req.user.roll_number }).sort({
      created_at: -1,
    });

    const tasksWithPoints = await Promise.all(
      tasks.map(async (task) => {
        const user = await User.findOne({ roll_number: task.posted_by }).select(
          "points"
        );
        return {
          ...task.toObject(),
          posted_by_points: user ? user.points : 0,
        };
      })
    );

    res.json({ tasks: tasksWithPoints });
  } catch (error) {
    console.error("Get my accepted tasks error:", error);
    res.status(500).json({ message: "Server error fetching accepted tasks" });
  }
});

router.post("/accept-request/:id", authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { roll_number, name } = req.user;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.posted_by === roll_number) {
      return res
        .status(403)
        .json({ message: "You cannot accept your own request" });
    }

    if (task.status !== "open") {
      return res.status(400).json({ message: "Task is no longer available" });
    }

    if (task.accepted_by !== null && task.accepted_by !== undefined) {
      return res.status(400).json({
        message: "This task has already been accepted by someone else",
      });
    }

    task.status = "accepted";
    task.accepted_by = roll_number;
    task.accepted_by_name = name;
    await task.save();

    const notification = new Notification({
      type: "task_accepted",
      sender: roll_number,
      sender_name: name,
      receiver: task.posted_by,
      message: `Your request has been accepted by ${name}.`,
      task_id: task._id,
    });

    await notification.save();

    res.json({
      message: "Task accepted successfully",
      task,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ message: "Server error while accepting task" });
  }
});

router.delete("/delete-request/:id", authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { roll_number } = req.user;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.posted_by !== roll_number) {
      return res
        .status(403)
        .json({ message: "You can only delete your own tasks" });
    }

    await Task.findByIdAndDelete(taskId);
    await Notification.deleteMany({ task_id: taskId });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error while deleting task" });
  }
});

router.post(
  "/complete-task/:id",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const taskId = req.params.id;
      const { roll_number, name } = req.user;

      const task = await Task.findById(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.accepted_by !== roll_number) {
        return res
          .status(403)
          .json({ message: "You are not assigned to this task" });
      }

      if (task.status === "completed") {
        return res.status(400).json({ message: "Task is already completed" });
      }

      task.file_link = req.file ? req.file.filename : null;
      task.status = "completed";
      task.completed_at = new Date();
      await task.save();

      const completedOnTime = new Date() <= new Date(task.deadline);
      let pointsAdded = 0;

      if (completedOnTime) {
        await User.findOneAndUpdate({ roll_number }, { $inc: { points: 10 } });
        pointsAdded = 10;
      }

      const notification = new Notification({
        type: "task_completed",
        sender: roll_number,
        sender_name: name,
        receiver: task.posted_by,
        message: `${name} has submitted your task. Please give reward within 2 days.`,
        task_id: task._id,
      });

      await notification.save();

      res.json({
        message: "Task completed successfully",
        task,
        pointsAdded,
      });
    } catch (error) {
      console.error("Complete task error:", error);
      res.status(500).json({ message: "Server error while completing task" });
    }
  }
);

router.post("/reward-status/:id", authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const { roll_number, name } = req.user;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.accepted_by !== roll_number) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (status === "received") {
      task.status = "verified";
      await task.save();

      const notification = new Notification({
        type: "reward_confirmed",
        sender: roll_number,
        sender_name: name,
        receiver: task.posted_by,
        message: `${name} has confirmed receiving the reward for your task.`,
        task_id: task._id,
      });

      await notification.save();

      res.json({ message: "Reward confirmed successfully" });
    } else {
      const notification = new Notification({
        type: "reward_reminder",
        sender: roll_number,
        sender_name: name,
        receiver: task.posted_by,
        message: `${name} hasn't received the reward yet for the completed task.`,
        task_id: task._id,
      });

      await notification.save();

      res.json({ message: "Reminder sent to task creator" });
    }
  } catch (error) {
    console.error("Reward status error:", error);
    res.status(500).json({ message: "Server error updating reward status" });
  }
});

router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select("name roll_number points");

    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Server error fetching leaderboard" });
  }
});

module.exports = router;
