const Device = require("../models/Device");

// O cliente MQTT é injetado em tempo de inicialização
let mqttClient = null;

const setMqttClient = (client) => {
  mqttClient = client;
};

// GET /api/devices
const listDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ name: 1 });
    res.json(devices);
  } catch (err) {
    console.error("Erro ao buscar dispositivos:", err);
    res.status(500).json({ error: "Erro ao buscar dispositivos" });
  }
};

// POST /api/devices
const createDevice = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "O campo 'name' é obrigatório" });
    }

    await Device.findOneAndUpdate(
      { name },
      { name, isActive: true },
      { upsert: true, new: true }
    );

    if (mqttClient) {
      mqttClient.publish("home/scanner/config", name);
    }

    console.log(`✅ Dispositivo ${name} salvo e enviado ao ESP32`);
    res.json({ message: `ESP32 configurado para buscar: ${name}` });
  } catch (err) {
    console.error("Erro ao salvar dispositivo:", err);
    res.status(500).json({ error: "Erro ao salvar no banco" });
  }
};

// PUT /api/devices/:id
const updateDevice = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const updated = await Device.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    res.json({ message: "Dispositivo atualizado com sucesso!", device: updated });
  } catch (err) {
    console.error("Erro ao atualizar dispositivo:", err);
    res.status(500).json({ error: "Erro ao atualizar dispositivo" });
  }
};

// DELETE /api/devices/:id
const deleteDevice = async (req, res) => {
  try {
    const deleted = await Device.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    res.json({ message: `Dispositivo "${deleted.name}" excluído com sucesso!` });
  } catch (err) {
    console.error("Erro ao excluir dispositivo:", err);
    res.status(500).json({ error: "Erro ao excluir dispositivo" });
  }
};

module.exports = { listDevices, createDevice, updateDevice, deleteDevice, setMqttClient };
