const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");

const URGENT_DURATION_MS = 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 10 * 60 * 1000;
const AUTO_BUMP_HOURS = 6;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
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

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
};

const parseNumber = (value, fallback = null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const stripQuizAnswers = (task) => {
  if (!task.skill_quiz?.enabled) return task;
  const clone = { ...task };
  clone.skill_quiz = {
    enabled: true,
    questions: task.skill_quiz.questions.map((q) => ({
      prompt: q.prompt,
      options: q.options,
    })),
  };
  return clone;
};

const updateUserActivity = async (rollNumber) => {
  await User.updateOne(
    { roll_number: rollNumber },
    { $set: { last_active_at: new Date() } }
  );
};

const getBaseRewardPoints = (task) => {
  const base = Number.isFinite(task.reward_points) ? task.reward_points : 10;
  if (task.urgent && task.urgent_expires_at) {
    if (new Date() <= new Date(task.urgent_expires_at)) {
      return base * 2;
    }
  }
  return base;
};

const splitPoints = (total, members) => {
  if (!members.length) return [];
  const share = Math.floor(total / members.length);
  const remainder = total - share * members.length;
  return members.map((m, idx) => ({
    roll_number: m.roll_number,
    name: m.name,
    points: idx === 0 ? share + remainder : share,
  }));
};

router.post("/post-request", authMiddleware, async (req, res) => {
  try {
    const { roll_number, name } = req.user;
    const {
      request,
      deadline,
      reward,
      board_type,
      course_code,
      club_name,
      reward_points,
      max_reward_points,
      bidding_enabled,
      team_size,
      urgent,
      anonymous,
      required_skills,
      microtask_mode,
      bundle_mode,
      microtasks,
      skill_quiz,
    } = req.body;

    if (!request || !deadline || !reward) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const poster = await User.findOne({ roll_number });
    if (!poster) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedBoard = board_type || "general";
    if (normalizedBoard === "course" && !course_code) {
      return res.status(400).json({ message: "Course code is required" });
    }
    if (normalizedBoard === "fest_club" && !club_name) {
      return res.status(400).json({ message: "Club or fest name is required" });
    }

    const teamSize = Math.min(Math.max(parseNumber(team_size, 1), 1), 5);
    const isUrgent = parseBoolean(urgent);
    const isAnonymous = parseBoolean(anonymous);
    const isBidding = parseBoolean(bidding_enabled);
    const isMicro = parseBoolean(microtask_mode);
    const isBundle = parseBoolean(bundle_mode);

    let parsedQuiz = null;
    if (skill_quiz) {
      try {
        parsedQuiz = typeof skill_quiz === "string" ? JSON.parse(skill_quiz) : skill_quiz;
      } catch (err) {
        return res.status(400).json({ message: "Invalid skill quiz format" });
      }
    }

    const quizEnabled = parseBoolean(parsedQuiz?.enabled);
    const quizQuestions = Array.isArray(parsedQuiz?.questions)
      ? parsedQuiz.questions
          .map((q) => ({
            prompt: String(q.prompt || "").trim(),
            options: Array.isArray(q.options)
              ? q.options.map((o) => String(o).trim()).filter(Boolean)
              : [],
            correct_index: parseNumber(q.correct_index, null),
          }))
          .filter(
            (q) =>
              q.prompt &&
              q.options.length >= 2 &&
              Number.isFinite(q.correct_index)
          )
      : [];

    let parsedMicrotasks = [];
    if (microtasks) {
      try {
        parsedMicrotasks =
          typeof microtasks === "string" ? JSON.parse(microtasks) : microtasks;
      } catch (err) {
        return res.status(400).json({ message: "Invalid microtasks format" });
      }
    }

    if (isMicro && (!Array.isArray(parsedMicrotasks) || parsedMicrotasks.length === 0)) {
      return res.status(400).json({ message: "Add at least one microtask" });
    }

    const normalizedMicrotasks = Array.isArray(parsedMicrotasks)
      ? parsedMicrotasks.slice(0, 5).map((t) => ({
          title: String(t.title || "").trim(),
          points: parseNumber(t.points, 0),
          duration_mins: parseNumber(t.duration_mins, 0),
        }))
      : [];

    const numericReward = parseNumber(reward_points, null);
    const numericMaxReward = parseNumber(max_reward_points, null);

    if (isBidding && !Number.isFinite(numericMaxReward)) {
      return res.status(400).json({ message: "Max reward points required" });
    }

    let pointsToLock = null;
    if (isBidding) {
      pointsToLock = numericMaxReward;
    } else if (Number.isFinite(numericReward)) {
      pointsToLock = numericReward;
    }

    let escrowLocked = false;
    if (Number.isFinite(pointsToLock) && pointsToLock > 0) {
      const available = poster.points - poster.escrow_points;
      if (available < pointsToLock) {
        return res.status(400).json({
          message: "Insufficient points for escrow. Reduce reward points.",
        });
      }
      await User.updateOne(
        { roll_number },
        { $inc: { points: -pointsToLock, escrow_points: pointsToLock } }
      );
      escrowLocked = true;
    }

    const urgentExpiresAt = isUrgent
      ? new Date(Date.now() + URGENT_DURATION_MS)
      : null;

    const task = new Task({
      request,
      deadline,
      reward,
      reward_points: Number.isFinite(numericReward) ? numericReward : null,
      max_reward_points: Number.isFinite(numericMaxReward)
        ? numericMaxReward
        : null,
      bidding_enabled: isBidding,
      board_type: normalizedBoard,
      course_code: course_code || null,
      club_name: club_name || null,
      posted_by: roll_number,
      posted_by_name: name,
      posted_by_role: poster.role,
      team_size: teamSize,
      team_open_slots: teamSize,
      urgent: isUrgent,
      urgent_expires_at: urgentExpiresAt,
      anonymous: isAnonymous,
      required_skills: normalizeList(required_skills),
      microtask_mode: isMicro,
      bundle_mode: isBundle,
      microtasks: normalizedMicrotasks,
      skill_quiz: {
        enabled: quizEnabled,
        questions: quizQuestions,
      },
      escrow_locked: escrowLocked,
    });

    await task.save();
    await updateUserActivity(roll_number);

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

    if (isUrgent && task.required_skills.length) {
      const onlineUsers = allUsers.filter((user) => {
        if (!user.last_active_at) return false;
        const isOnline =
          Date.now() - new Date(user.last_active_at).getTime() <= ONLINE_WINDOW_MS;
        const hasSkill = user.skills?.some((s) =>
          task.required_skills.includes(s)
        );
        return isOnline && hasSkill;
      });

      if (onlineUsers.length) {
        const urgentNotifications = onlineUsers.map((user) => ({
          type: "urgent_sos",
          sender: roll_number,
          sender_name: name,
          receiver: user.roll_number,
          message: `SOS task needs help now: ${request.substring(0, 60)}...`,
          task_id: task._id,
        }));
        await Notification.insertMany(urgentNotifications);
      }
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
    const currentUser = await User.findOne({ roll_number: req.user.roll_number });
    const tasks = await Task.find({
      $or: [
        { status: "open", accepted_by: null },
        { status: "accepted", team_open_slots: { $gt: 0 } },
      ],
    }).sort({ created_at: -1 });

    const now = Date.now();
    const bumpThreshold = AUTO_BUMP_HOURS * 60 * 60 * 1000;

    const tasksWithPoints = await Promise.all(
      tasks.map(async (task) => {
        if (task.status === "open" && task.accepted_by === null) {
          const needsBump =
            now - new Date(task.created_at).getTime() >= bumpThreshold &&
            (!task.last_bumped_at ||
              now - new Date(task.last_bumped_at).getTime() >= bumpThreshold);

          if (needsBump) {
            task.bump_count += 1;
            task.last_bumped_at = new Date();
            await task.save();

            await Notification.create({
              type: "task_auto_bump",
              sender: task.posted_by,
              sender_name: task.posted_by_name,
              receiver: task.posted_by,
              message: "Your task was auto-bumped. Consider increasing reward.",
              task_id: task._id,
            });
          }
        }

        const user = await User.findOne({ roll_number: task.posted_by }).select(
          "points"
        );

        const taskObj = task.toObject();
        const isOwner = task.posted_by === req.user.roll_number;
        const isMember = task.team_members?.some(
          (m) => m.roll_number === req.user.roll_number
        );

        if (task.anonymous && !isOwner && !isMember) {
          taskObj.posted_by_name = "Anonymous";
        }

        const withQuizStripped = stripQuizAnswers(taskObj);
        const priorityMatch = currentUser?.courses?.includes(task.course_code)
          ? 1
          : 0;

        return {
          ...withQuizStripped,
          posted_by_points: user ? user.points : 0,
          priority_score: priorityMatch,
          can_waitlist:
            task.status === "accepted" && task.team_open_slots <= 0,
          lowest_bid: task.bids.length
            ? Math.min(...task.bids.map((b) => b.amount))
            : null,
          bump_suggestion_points: Number.isFinite(task.reward_points)
            ? Math.ceil(task.reward_points * 1.15)
            : null,
        };
      })
    );

    tasksWithPoints.sort((a, b) => {
      if (a.priority_score !== b.priority_score) {
        return b.priority_score - a.priority_score;
      }
      if (a.urgent !== b.urgent) {
        return b.urgent - a.urgent;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

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
    const tasks = await Task.find({
      $or: [
        { accepted_by: req.user.roll_number },
        { "team_members.roll_number": req.user.roll_number },
      ],
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
    console.error("Get my accepted tasks error:", error);
    res.status(500).json({ message: "Server error fetching tasks" });
  }
});

router.get("/skill-quiz/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!(task.status === "accepted" && task.team_open_slots <= 0)) {
      return res.status(400).json({ message: "Waitlist is not available" });
    }

    if (!task.skill_quiz?.enabled) {
      return res.json({ enabled: false, questions: [] });
    }

    res.json({
      enabled: true,
      questions: task.skill_quiz.questions.map((q) => ({
        prompt: q.prompt,
        options: q.options,
      })),
    });
  } catch (error) {
    console.error("Get skill quiz error:", error);
    res.status(500).json({ message: "Server error fetching quiz" });
  }
});

router.post("/accept-request/:id", authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { roll_number, name } = req.user;
    const { skill_answers } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.posted_by === roll_number) {
      return res
        .status(403)
        .json({ message: "You cannot accept your own request" });
    }

    if (task.bidding_enabled) {
      return res.status(400).json({ message: "This task requires bidding" });
    }

    if (task.skill_quiz?.enabled) {
      const answers = Array.isArray(skill_answers) ? skill_answers : [];
      const passed = task.skill_quiz.questions.every((q, idx) => {
        return Number(answers[idx]) === q.correct_index;
      });
      if (!passed) {
        return res.status(400).json({ message: "Skill test failed" });
      }
    }

    if (task.status === "open") {
      task.status = "accepted";
      task.accepted_by = roll_number;
      task.accepted_by_name = name;
    } else if (task.status === "accepted" && task.team_open_slots > 0) {
      if (!task.team_members.some((m) => m.roll_number === roll_number)) {
        task.team_members.push({ roll_number, name });
        task.team_open_slots = Math.max(task.team_open_slots - 1, 0);
      }
    } else {
      return res.status(400).json({ message: "Task is no longer available" });
    }

    if (task.status === "accepted" && task.team_members.length === 0) {
      task.team_members.push({ roll_number, name });
      task.team_open_slots = Math.max(task.team_size - 1, 0);
    }

    if (task.urgent && task.urgent_expires_at) {
      if (new Date() > new Date(task.urgent_expires_at)) {
        task.urgent = false;
      }
    }

    await task.save();
    await updateUserActivity(roll_number);

    if (task.microtask_mode) {
      const basePoints = getBaseRewardPoints(task);
      const members = task.team_members.length
        ? task.team_members
        : [{ roll_number, name }];
      const allocations = splitPoints(basePoints, members);

      await Promise.all(
        allocations.map((m) =>
          User.updateOne(
            { roll_number: m.roll_number },
            { $inc: { points: m.points } }
          )
        )
      );

      if (task.escrow_locked) {
        const pointsToRelease = task.reward_points || task.max_reward_points || 0;
        if (pointsToRelease > 0) {
          await User.updateOne(
            { roll_number: task.posted_by },
            { $inc: { escrow_points: -pointsToRelease } }
          );
        }
        task.escrow_locked = false;
      }

      task.status = "verified";
      task.completed_at = new Date();
      task.verified_at = new Date();
      await task.save();
    }

    const notification = new Notification({
      type: task.team_size > 1 ? "task_team_joined" : "task_accepted",
      sender: roll_number,
      sender_name: name,
      receiver: task.posted_by,
      message: `${name} has ${
        task.team_size > 1 ? "joined your team" : "accepted your request"
      }.`,
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

router.post("/join-waitlist/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { roll_number, name } = req.user;
    if (task.posted_by === roll_number) {
      return res.status(403).json({ message: "You cannot waitlist your own task" });
    }

    const already = task.waitlist.some((w) => w.roll_number === roll_number);
    if (!already) {
      task.waitlist.push({ roll_number, name });
      await task.save();
    }

    await updateUserActivity(roll_number);

    res.json({ message: "Added to waitlist" });
  } catch (error) {
    console.error("Join waitlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/drop-task/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { roll_number } = req.user;
    const wasMember = task.team_members.some(
      (m) => m.roll_number === roll_number
    );

    if (!wasMember && task.accepted_by !== roll_number) {
      return res.status(403).json({ message: "Not assigned to this task" });
    }

    task.team_members = task.team_members.filter(
      (m) => m.roll_number !== roll_number
    );
    if (task.accepted_by === roll_number) {
      task.accepted_by = null;
      task.accepted_by_name = null;
      task.status = "open";
    }

    task.team_open_slots = Math.max(task.team_size - task.team_members.length, 0);

    if (task.waitlist.length && task.team_open_slots > 0) {
      const next = task.waitlist.shift();
      task.team_members.push({ roll_number: next.roll_number, name: next.name });
      task.team_open_slots = Math.max(task.team_open_slots - 1, 0);
      task.accepted_by = task.accepted_by || next.roll_number;
      task.accepted_by_name = task.accepted_by_name || next.name;
      task.status = "accepted";

      await Notification.create({
        type: "task_reassigned",
        sender: task.posted_by,
        sender_name: task.posted_by_name,
        receiver: next.roll_number,
        message: "A task you waitlisted is now available and assigned to you.",
        task_id: task._id,
      });
    }

    await task.save();
    await updateUserActivity(roll_number);

    res.json({ message: "Task dropped" });
  } catch (error) {
    console.error("Drop task error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/bid/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.bidding_enabled) {
      return res.status(400).json({ message: "Bidding not enabled" });
    }

    const { roll_number, name } = req.user;
    const amount = parseNumber(req.body.amount, null);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    if (task.max_reward_points && amount > task.max_reward_points) {
      return res
        .status(400)
        .json({ message: "Bid exceeds max reward points" });
    }

    task.bids = task.bids.filter((b) => b.roll_number !== roll_number);
    task.bids.push({ roll_number, name, amount });
    await task.save();
    await updateUserActivity(roll_number);

    await Notification.create({
      type: "bid_received",
      sender: roll_number,
      sender_name: name,
      receiver: task.posted_by,
      message: `${name} placed a bid of ${amount} points.`,
      task_id: task._id,
    });

    res.json({ message: "Bid submitted" });
  } catch (error) {
    console.error("Bid error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/select-bid/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.posted_by !== req.user.roll_number) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { roll_number } = req.body;
    const bid = task.bids.find((b) => b.roll_number === roll_number);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    task.accepted_by = bid.roll_number;
    task.accepted_by_name = bid.name;
    task.status = "accepted";
    task.reward_points = bid.amount;
    task.bidding_enabled = false;
    task.team_members = [{ roll_number: bid.roll_number, name: bid.name }];
    task.team_open_slots = Math.max(task.team_size - 1, 0);

    if (task.max_reward_points && task.escrow_locked) {
      const refund = task.max_reward_points - bid.amount;
      if (refund > 0) {
        await User.updateOne(
          { roll_number: task.posted_by },
          { $inc: { points: refund, escrow_points: -refund } }
        );
      }
    }

    await task.save();

    await Notification.create({
      type: "bid_selected",
      sender: task.posted_by,
      sender_name: task.posted_by_name,
      receiver: bid.roll_number,
      message: "Your bid was selected. You are assigned to this task.",
      task_id: task._id,
    });

    res.json({ message: "Bid selected", task });
  } catch (error) {
    console.error("Select bid error:", error);
    res.status(500).json({ message: "Server error" });
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

    if (task.escrow_locked && task.max_reward_points) {
      await User.updateOne(
        { roll_number },
        { $inc: { points: task.max_reward_points, escrow_points: -task.max_reward_points } }
      );
    } else if (task.escrow_locked && task.reward_points) {
      await User.updateOne(
        { roll_number },
        { $inc: { points: task.reward_points, escrow_points: -task.reward_points } }
      );
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

      const isMember = task.team_members.some(
        (m) => m.roll_number === roll_number
      );
      if (!isMember && task.accepted_by !== roll_number) {
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

      const completedOnTime = task.completed_at <= new Date(task.deadline);
      let pointsAdded = 0;

      if (completedOnTime && !task.escrow_locked) {
        const basePoints = getBaseRewardPoints(task);
        const members = task.team_members.length
          ? task.team_members
          : [{ roll_number, name }];
        const allocations = splitPoints(basePoints, members);
        pointsAdded = basePoints;

        await Promise.all(
          allocations.map((m) =>
            User.updateOne(
              { roll_number: m.roll_number },
              { $inc: { points: m.points } }
            )
          )
        );
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
      await updateUserActivity(roll_number);

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

    const isMember = task.team_members.some(
      (m) => m.roll_number === roll_number
    );

    if (!isMember && task.accepted_by !== roll_number) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (status === "received") {
      task.status = "verified";
      task.verified_at = new Date();
      await task.save();

      if (task.escrow_locked) {
        const basePoints = getBaseRewardPoints(task);
        const members = task.team_members.length
          ? task.team_members
          : [{ roll_number: task.accepted_by, name: task.accepted_by_name }];
        const allocations = splitPoints(basePoints, members);

        await Promise.all(
          allocations.map((m) =>
            User.updateOne(
              { roll_number: m.roll_number },
              { $inc: { points: m.points } }
            )
          )
        );

        const pointsToRelease = task.reward_points || task.max_reward_points || 0;
        if (pointsToRelease > 0) {
          await User.updateOne(
            { roll_number: task.posted_by },
            { $inc: { escrow_points: -pointsToRelease } }
          );
        }

        task.escrow_locked = false;
        await task.save();
      }

      const notification = new Notification({
        type: "reward_confirmed",
        sender: roll_number,
        sender_name: name,
        receiver: task.posted_by,
        message: `${name} has confirmed receiving the reward for your task.`,
        task_id: task._id,
      });

      await notification.save();
      await updateUserActivity(roll_number);

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
      await updateUserActivity(roll_number);

      res.json({ message: "Reminder sent to task creator" });
    }
  } catch (error) {
    console.error("Reward status error:", error);
    res.status(500).json({ message: "Server error updating reward status" });
  }
});

router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const users = await User.aggregate([
      {
        $addFields: {
          daysInactive: {
            $floor: {
              $divide: [{ $subtract: [now, "$last_active_at"] }, 86400000],
            },
          },
        },
      },
      {
        $addFields: {
          decay: { $floor: { $divide: ["$daysInactive", 7] } },
        },
      },
      {
        $addFields: {
          effective_points: {
            $max: [{ $subtract: ["$points", "$decay"] }, 0],
          },
        },
      },
      { $sort: { effective_points: -1 } },
      { $limit: 10 },
      { $project: { name: 1, roll_number: 1, points: 1, effective_points: 1 } },
    ]);

    res.json({ leaderboard: users });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Server error fetching leaderboard" });
  }
});

module.exports = router;
