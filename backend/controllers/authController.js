const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const usersFile = path.join(__dirname, "../data/users.json");

const JWT_SECRET = "secretkey";

// Helper: read users
const getUsers = () => {
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
};

// Helper: save users
const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// SIGNUP
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

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
    role
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
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  });
};

module.exports = {
  signup,
  login
};