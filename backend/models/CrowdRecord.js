const mongoose = require("mongoose");

const crowdRecordSchema = new mongoose.Schema(
    {
        routeId: {
            type: String,
            required: true
        },

        busNumber: {
            type: String,
            required: true
        },

        stopId: {
            type: String,
            required: true
        },

        passengers: {
            type: Number,
            required: true,
            min: 0
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        occupancy: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        crowdLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "FULL"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CrowdRecord",
    crowdRecordSchema
);