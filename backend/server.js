const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const rideRoutes = require("./routes/rideRoutes");
const authRoutes = require("./routes/authRoutes");
const { runSimulation } = require("./services/simulationEngine");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach io to requests if needed by controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use("/api/rides", rideRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running with WebSockets...");
});

// Socket Connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Start physics loop
runSimulation(io);

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Sockets`);
});