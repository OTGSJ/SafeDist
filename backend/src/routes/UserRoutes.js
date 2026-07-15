const express = require("express");
const router = express.Router();
const { login, register, listUsers, deleteUser, updateUser } = require("../controllers/UserController");

router.post("/login", login);
router.post("/register", register);
router.get("/", listUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
