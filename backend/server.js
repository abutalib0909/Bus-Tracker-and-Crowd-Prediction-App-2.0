require("dotenv").config();
const SIMULATED_BUS_NUMBER = "DEMO-01";
const express = require("express");
const cors = require("cors");
const connectDatabase = require("./database");
const crowdRoutes = require("./routes/crowdRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Crowd routes
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
        databaseState: states[mongoose.connection.readyState],
        databaseName: mongoose.connection.name || null
    });
});

// Connect database first, then start server
connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Server startup failed:");
        console.error(error.message);
    });