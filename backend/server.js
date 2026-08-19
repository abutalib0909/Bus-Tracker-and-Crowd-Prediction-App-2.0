require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDatabase = require("./database");
const crowdRoutes = require("./routes/crowdRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/crowd", crowdRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Bus Tracker API is running!"
    });
});

// Database status
app.get("/api/db-status", (req, res) => {
    const mongoose = require("mongoose");

    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    res.json({
        success: mongoose.connection.readyState === 1,
        databaseState:
            states[mongoose.connection.readyState],
        databaseName:
            mongoose.connection.name || null
    });
});


// ============================================================
// SOCKET.IO
// ============================================================

io.on("connection", (socket) => {

    console.log(
        `🔌 Client connected: ${socket.id}`
    );

    socket.on("driverLocation", (locationData) => {

        console.log(
            "📍 Driver location:",
            locationData
        );

        // Send location to every connected passenger
        io.emit(
            "busLocation",
            locationData
        );
    });

    socket.on("disconnect", () => {

        console.log(
            `🔌 Client disconnected: ${socket.id}`
        );
    });
});


// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
connectDatabase()
    .then(() => {

        server.listen(PORT, "0.0.0.0", () => {

            console.log(
                `🚀 Server running on port ${PORT}`
            );

            console.log(
                "⚡ Socket.IO real-time tracking enabled."
            );
        });

    })
    .catch((error) => {

        console.error(
            "❌ Server startup failed:"
        );

        console.error(
            error.message
        );
    });