const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ where: { name } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Nome ou senha incorretos" });
    }

    res.status(200).json({
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao realizar login." });
  }
});

// Rota para Cadastrar Novo Usuário no SQLite
router.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;

    // Verifica se o nome já existe no SQLite
    const userExists = await User.findOne({ where: { name } });
    if (userExists) {
      return res.status(400).json({ error: "Este nome já está cadastrado." });
    }

    // Salva apenas no SQLite
    const newUser = await User.create({ name, password });

    res.status(201).json({
      message: "Usuário cadastrado com sucesso no SQLite!",
      user: {
        id: newUser.id,
        name: newUser.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

module.exports = router;
