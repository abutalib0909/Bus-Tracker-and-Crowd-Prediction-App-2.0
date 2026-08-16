const express = require("express");

const {
    createCrowdRecord,
    getCrowdRecords
} = require("../controllers/crowdController");

const router = express.Router();

router.post("/", createCrowdRecord);

router.get("/", getCrowdRecords);

module.exports = router;