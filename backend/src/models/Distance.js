const mongoose = require('mongoose');

const DistanceSchema = new mongoose.Schema({
    distancia: Number,
    rssi: Number,
    id: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Distance', DistanceSchema);