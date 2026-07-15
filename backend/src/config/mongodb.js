const mongoose = require("mongoose");

const connectMongo = async () => {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log("🍃 MongoDB conectado com sucesso");
  } catch (err) {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  }
};

module.exports = { connectMongo };
