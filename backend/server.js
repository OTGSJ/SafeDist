const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const sequelize = require("./src/config/database");
const { initMqtt } = require("./src/services/MqttService");
const distanceRoutes = require("./src/routes/DistanceRoutes");
const userRoutes = require("./src/routes/UserRoutes");
const Device = require("./src/models/Device");

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Conexão com o MongoDB
const MONGO_URI =
  "mongodb+srv://jogs1_db_user:hxh853SVpn@cluster0.nbxjf8g.mongodb.net/";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🍃 MongoDB Conectado com sucesso"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// 2. Conexão e Sincronização com o SQLite
sequelize
  .sync({ alter: true })
  .then(() => console.log("📦 Banco SQLite inicializado para Usuários!"))
  .catch((err) => console.error("❌ Erro ao conectar ao SQLite:", err));

// 3. Inicializa o Serviço MQTT
const mqttClient = initMqtt();

// 4. Define as Rotas da API
app.use("/api/distance", distanceRoutes);
app.use("/api/users", userRoutes); // 👈 3. Ativa as rotas do SQLite (/api/users/register)

// Rota extra: Enviar comando para o ESP32 via API (Opcional para a Web 2)
app.post("/api/led-command", (req, res) => {
  const { status } = req.body; // "ON" ou "OFF"
  mqttClient.publish("home/led/command", status);
  res.send({ message: `Comando ${status} enviado ao ESP32` });
});

// CRUD: Criar dispositivo e avisar o ESP32
app.post("/api/devices", async (req, res) => {
  try {
    const { name } = req.body;

    await Device.findOneAndUpdate(
      { name: name },
      { name: name, isActive: true },
      { upsert: true, new: true },
    );

    mqttClient.publish("home/scanner/config", name);

    console.log(`✅ Dispositivo ${name} salvo no DB e enviado ao ESP32`);
    res.json({ message: `ESP32 configurado para buscar: ${name}` });
  } catch (err) {
    console.error("Erro ao salvar dispositivo:", err);
    res.status(500).json({ error: "Erro ao salvar no banco" });
  }
});

app.get("/api/devices", async (req, res) => {
  try {
    const devices = await Device.find().sort({ name: 1 });
    res.json(devices.map((d) => d.name));
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar dispositivos" });
  }
});

// Controle: Ligar/Desligar Medição
app.post("/api/scanner/control", (req, res) => {
  const { command } = req.body; // "START" ou "STOP"
  mqttClient.publish("home/scanner/command", command);
  res.json({ status: `Medição ${command}` });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
