require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const connectDatabase = require("./database");
const crowdRoutes = require("./routes/crowdRoutes");

const app = express();

// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 5000;

// ============================================================
// HTTP SERVER
// ============================================================

const server = http.createServer(app);

// ============================================================
// SOCKET.IO
// ============================================================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

// ============================================================
// ROUTES
// ============================================================

app.use("/api/crowd", crowdRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Bus Tracker API is running!"
    });

});

// ============================================================
// DATABASE STATUS
// ============================================================

app.get("/api/db-status", (req, res) => {

    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    res.json({

        success:
            mongoose.connection.readyState === 1,

        databaseState:
            states[mongoose.connection.readyState],

        databaseName:
            mongoose.connection.name || null

    });

});

// ============================================================
// SOCKET.IO EVENTS
// ============================================================

io.on("connection", (socket) => {

    console.log(
        `🔌 Client connected: ${socket.id}`
    );

    // --------------------------------------------------------
    // DRIVER GPS
    // --------------------------------------------------------

    socket.on(
        "driverLocation",
        (locationData) => {

            console.log(
                "📍 Driver location:",
                locationData
            );

            // Send GPS location to passengers
            io.emit(
                "busLocation",
                locationData
            );

        }
    );

    // --------------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------------

    socket.on("disconnect", () => {

        console.log(
            `🔌 Client disconnected: ${socket.id}`
        );

    });

});

// ============================================================
// START SERVER
// ============================================================

connectDatabase()

    .then(() => {

        server.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `🚀 Server running on port ${PORT}`
                );

                console.log(
                    "⚡ Socket.IO real-time tracking enabled."
                );

            }
        );

    })

    .catch((error) => {

        console.error(
            "❌ Server startup failed:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    });