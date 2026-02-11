const express = require('express');
const router = express.Router();
const Distance = require('../models/Distance');

// Rota para pegar os últimos 50 registros para o gráfico
router.get('/history', async (req, res) => {
    try {
        const logs = await Distance.find().sort({ createdAt: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// Rota para apagar todos os registros do banco
router.delete('/clear', async (req, res) => {
    try {
        await Distance.deleteMany({});
        res.json({ message: 'Histórico apagado com sucesso! O gráfico será resetado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao limpar o banco de dados' });
    }
});

module.exports = router;