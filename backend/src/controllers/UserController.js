const User = require("../models/User");

// POST /api/users/login
const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Nome e senha são obrigatórios" });
    }

    const user = await User.findOne({ where: { name } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Nome ou senha incorretos" });
    }

    res.status(200).json({
      message: "Login realizado com sucesso!",
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("Erro ao realizar login:", err);
    res.status(500).json({ error: "Erro ao realizar login." });
  }
};

// POST /api/users/register
const register = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Nome e senha são obrigatórios" });
    }

    const userExists = await User.findOne({ where: { name } });
    if (userExists) {
      return res.status(400).json({ error: "Este nome já está cadastrado." });
    }

    const newUser = await User.create({ name, password });

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: { id: newUser.id, name: newUser.name },
    });
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (name && name.trim()) user.name = name.trim();
    if (password && password.trim()) user.password = password.trim();
    await user.save();

    res.json({
      message: "Usuário atualizado com sucesso.",
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

// GET /api/users
const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    await user.destroy();
    res.json({ message: `Usuário "${user.name}" excluído com sucesso.` });
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
};

module.exports = { login, register, listUsers, deleteUser, updateUser };
