const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// Valid IITJ department codes
const VALID_DEPT_CODES = [
  "bb", // Bioscience & Bioengineering
  "cs", // Computer Science & Engineering
  "me", // Mechanical Engineering
  "ee", // Electrical Engineering
  "ce", // Civil Engineering
  "ch", // Chemical Engineering
  "ph", // Physics
  "ma", // Mathematics
  "hs", // Humanities & Social Sciences
  "mt", // Materials & Metallurgical Engineering
  "cm", // Computing & Mathematics
  "ec", // Electronics & Communication
];

// Roll number regex: b + 2-digit year + 2-letter dept + 4-digit number  (e.g. b25bb1002)
const ROLL_NUMBER_REGEX = /^[bB]\d{2}[a-zA-Z]{2}\d{4}$/;

function validateIITJRollNumber(roll) {
  const r = roll.toLowerCase();
  if (!ROLL_NUMBER_REGEX.test(r)) return false;
  const dept = r.slice(3, 5);
  return VALID_DEPT_CODES.includes(dept);
}

router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail().withMessage("Valid email is required")
      .custom((email) => {
        if (!email.endsWith("@iitj.ac.in")) {
          throw new Error("Email must be your IITJ email (rollnumber@iitj.ac.in)");
        }
        return true;
      }),
    body("roll_number")
      .notEmpty().withMessage("Roll number is required")
      .custom((roll) => {
        if (roll.length !== 9) throw new Error("Roll number must be exactly 9 characters");
        if (!validateIITJRollNumber(roll)) throw new Error("Invalid roll number format. Use: b25cs1002 (b + year + dept + 4 digits)");
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, roll_number, password } = req.body;

      // Ensure email prefix matches roll number
      const emailRoll = email.split("@")[0].toLowerCase();
      if (emailRoll !== roll_number.toLowerCase()) {
        return res.status(400).json({ message: "Email must match your roll number (rollnumber@iitj.ac.in)" });
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { roll_number }],
      });

      if (existingUser) {
        if (existingUser.roll_number === roll_number) {
          return res
            .status(400)
            .json({ message: "User already exists with this roll number" });
        }
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email,
        roll_number,
        password: hashedPassword,
      });

      await user.save();

      sendWelcomeEmail(email, name).catch((err) =>
        console.error("Welcome email failed:", err)
      );

      const token = jwt.sign(
        { userId: user._id, roll_number: user.roll_number, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roll_number: user.roll_number,
          points: user.points,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Server error during signup" });
    }
  }
);

router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Email or roll number is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { identifier, password } = req.body;

      // Detect if it's an email or a roll number
      const isEmail = identifier.includes("@");
      const query = isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { roll_number: identifier.toLowerCase().trim() };

      const user = await User.findOne(query);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials. Check your email/roll number and password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials. Check your email/roll number and password." });
      }

      const token = jwt.sign(
        { userId: user._id, roll_number: user.roll_number, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roll_number: user.roll_number,
          points: user.points,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roll_number: user.roll_number,
        points: user.points,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const emailSent = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send email. Please try again later." });
    }

    res.json({
      message: "Password reset link sent to your email",
      emailSent: true,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ message: "Reset link expired. Please request a new one." });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(400)
        .json({ message: "Invalid reset link. Please request a new one." });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
