const mqtt = require('mqtt');
const Distance = require('../models/Distance');

const initMqtt = () => {
    const client = mqtt.connect('mqtt://test.mosquitto.org');

    client.on('connect', () => {
        console.log('🔗 Conectado ao Broker MQTT');
        client.subscribe('home/distancia');
    });

    client.on('message', async (topic, message) => {
        try {
            if (topic === 'home/distancia') {
                const payload = JSON.parse(message.toString());
                
                // Cria o documento no MongoDB usando o Model
                const novaLeitura = new Distance({
                    distancia: payload.distancia,
                    rssi: payload.rssi,
                    id: payload.id || 'ESP32_Scanner' // Use 'id' para bater com o Model
                });

                await novaLeitura.save();
                console.log('📥 Mensagem recebida:', payload);
                console.log(`💾 Dado salvo: ${payload.distancia}m`);
            }
        } catch (err) {
            console.error('❌ Erro ao processar mensagem MQTT:', err);
        }
    });

    return client;
};

module.exports = { initMqtt };