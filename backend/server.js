require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectMongo } = require("./src/config/mongodb");
const sequelize = require("./src/config/database");
const { initMqtt } = require("./src/services/MqttService");

const distanceRoutes = require("./src/routes/DistanceRoutes");
const userRoutes = require("./src/routes/UserRoutes");
const deviceRoutes = require("./src/routes/DeviceRoutes");
const { router: scannerRouter, setMqttClient: setScannerMqtt } = require("./src/routes/ScannerRoutes");
const { setMqttClient: setDeviceMqtt } = require("./src/controllers/DeviceController");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Banco de Dados ─────────────────────────────────────────────────────────
connectMongo();

sequelize
  .sync({ alter: true })
  .then(() => console.log("📦 SQLite inicializado"))
  .catch((err) => console.error("❌ Erro ao conectar ao SQLite:", err));

// ─── MQTT ────────────────────────────────────────────────────────────────────
const mqttClient = initMqtt();

// Injeta o cliente MQTT nos módulos que precisam publicar
setDeviceMqtt(mqttClient);
setScannerMqtt(mqttClient);

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use("/api/distance", distanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/scanner", scannerRouter);

// Rota legada — envia comando para LED do ESP32 via MQTT
app.post("/api/led-command", (req, res) => {
  const { status } = req.body;
  mqttClient.publish("home/led/command", status);
  res.send({ message: `Comando ${status} enviado ao ESP32` });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
