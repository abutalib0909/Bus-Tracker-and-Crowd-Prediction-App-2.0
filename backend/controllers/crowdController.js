const CrowdRecord = require("../models/CrowdRecord");

async function createCrowdRecord(req, res) {
    try {
        const {
            routeId,
            busNumber,
            stopId,
            passengers,
            capacity
        } = req.body;

        if (
            !routeId ||
            !busNumber ||
            !stopId ||
            passengers === undefined ||
            !capacity
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required crowd data."
            });
        }

        const occupancy =
            (passengers / capacity) * 100;

        let crowdLevel;

        if (occupancy <= 40) {
            crowdLevel = "LOW";
        } else if (occupancy <= 70) {
            crowdLevel = "MEDIUM";
        } else if (occupancy <= 90) {
            crowdLevel = "HIGH";
        } else {
            crowdLevel = "FULL";
        }

        const record = await CrowdRecord.create({
            routeId,
            busNumber,
            stopId,
            passengers,
            capacity,
            occupancy,
            crowdLevel
        });

        res.status(201).json({
            success: true,
            message: "Crowd record saved successfully.",
            data: record
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to save crowd record."
        });
    }
}

async function getCrowdRecords(req, res) {
    try {
        const records = await CrowdRecord
            .find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: records.length,
            data: records
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch crowd records."
        });
    }
}

module.exports = {
    createCrowdRecord,
    getCrowdRecords
};