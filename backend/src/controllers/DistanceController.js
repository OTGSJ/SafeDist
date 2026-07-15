const Distance = require("../models/Distance");

// GET /api/distance/history
const getHistory = async (req, res) => {
  try {
    const logs = await Distance.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
};

// DELETE /api/distance/clear
const clearHistory = async (req, res) => {
  try {
    await Distance.deleteMany({});
    res.json({ message: "Histórico apagado com sucesso! O gráfico será resetado." });
  } catch (err) {
    console.error("Erro ao limpar histórico:", err);
    res.status(500).json({ error: "Erro ao limpar o banco de dados" });
  }
};

module.exports = { getHistory, clearHistory };
