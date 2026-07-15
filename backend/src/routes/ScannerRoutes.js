const express = require("express");
const router = express.Router();

// O cliente MQTT é injetado via factory para evitar dependência circular
let mqttClient = null;

const setMqttClient = (client) => {
  mqttClient = client;
};

// POST /api/scanner/control  — Ligar / Desligar medição
router.post("/control", (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Campo 'command' é obrigatório" });
  }
  if (mqttClient) {
    mqttClient.publish("home/scanner/command", command);
  }
  res.json({ status: `Medição ${command}` });
});

module.exports = { router, setMqttClient };
