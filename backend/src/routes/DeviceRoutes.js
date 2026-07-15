const express = require("express");
const router = express.Router();
const {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} = require("../controllers/DeviceController");

router.get("/", listDevices);
router.post("/", createDevice);
router.put("/:id", updateDevice);
router.delete("/:id", deleteDevice);

module.exports = router;
