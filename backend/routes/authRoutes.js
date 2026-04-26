const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  checkToken
} = require("../controllers/authController");

// Signup
router.post("/signup", signup);

// Login
router.post("/login", login);

// Check token (persisted login)
router.get("/check", checkToken);

module.exports = router;