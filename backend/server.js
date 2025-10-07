const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initializeTransporter } = require("./services/emailService");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const notificationRoutes = require("./routes/notifications");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    initializeTransporter().catch((err) =>
      console.error("Email init error:", err)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api", (req, res) => {
  res.json({
    status: "success",
    message: "BrinX API is running! 🚀",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    features: {
      emailNotifications: true,
      welcomeEmails: true,
      passwordReset: true,
    },
    endpoints: {
      authentication: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        forgotPassword: "POST /api/auth/forgot-password",
        resetPassword: "POST /api/auth/reset-password",
      },
      tasks: {
        postRequest: "POST /api/tasks/post-request",
        getRequests: "GET /api/tasks/get-requests",
        acceptRequest: "POST /api/tasks/accept-request/:id",
        deleteRequest: "DELETE /api/tasks/delete-request/:id",
        completeTask: "POST /api/tasks/complete-task/:id",
        myPostedTasks: "GET /api/tasks/my-posted-tasks",
        myAcceptedTasks: "GET /api/tasks/my-accepted-tasks",
        rewardStatus: "POST /api/tasks/reward-status/:id",
        leaderboard: "GET /api/tasks/leaderboard",
      },
      notifications: {
        getAll: "GET /api/notifications",
        markRead: "PATCH /api/notifications/:id/read",
        markAllRead: "PATCH /api/notifications/mark-all-read",
      },
    },
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/signup.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

app.get("/post-request", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/post-request.html"));
});

app.get("/view-requests", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/view-requests.html"));
});

app.get("/assigned-tasks", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/assigned-tasks.html"));
});

app.get("/notifications", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/notifications.html"));
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/forgot-password.html"));
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/reset-password.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 BrinX server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
  });
}
