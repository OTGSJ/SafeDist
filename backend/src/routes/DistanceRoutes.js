const express = require("express");
const router = express.Router();
const { getHistory, clearHistory } = require("../controllers/DistanceController");

router.get("/history", getHistory);
router.delete("/clear", clearHistory);

module.exports = router;