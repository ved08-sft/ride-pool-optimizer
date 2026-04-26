const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const usersFile = path.join(__dirname, "../data/users.json");

const JWT_SECRET = "secretkey";

// Helper: read users
const getUsers = () => {
  if (!fs.existsSync(usersFile)) return [];
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
};

// Helper: save users
const saveUsers = (users) => {
  const dir = path.dirname(usersFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// SIGNUP
const signup = async (req, res) => {
  const { name, email, password, role, age, gender } = req.body;

  let users = getUsers();

  // Check if user exists
  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashedPassword,
    role,
    age: age || "N/A",
    gender: gender || "N/A"
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ message: "User registered successfully" });
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  let users = getUsers();

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, age: user.age, gender: user.gender },
    JWT_SECRET,
    { expiresIn: "50d" } // Up to 50 days as requested for 'Remember Me' on same device
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      age: user.age,
      gender: user.gender
    }
  });
};

// CHECK TOKEN (for 50 days logic automatically logging in)
const checkToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded, valid: true });
  } catch (err) {
    res.status(401).json({ message: "Token expired or invalid", valid: false });
  }
};

module.exports = {
  signup,
  login,
  checkToken
};