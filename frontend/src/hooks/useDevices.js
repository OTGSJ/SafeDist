import { useState, useCallback } from "react";
import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from "../api/devicesApi";

const useDevices = () => {
  const [devices, setDevices] = useState([]);
  const [selectedBeacon, setSelectedBeacon] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await listDevices();
      setDevices(data);
    } catch (err) {
      console.error("Erro ao buscar dispositivos:", err);
    }
  }, []);

  // Cria beacon E publica no MQTT (configura o ESP32)
  const handleCreateDevice = async (name) => {
    if (!name || !name.trim()) return;
    await createDevice(name.trim());
    await refresh();
  };

  // Atualiza apenas o nome do beacon
  const handleUpdateDevice = async (id, name, device) => {
    await updateDevice(id, {
      name: name.trim(),
      description: device?.description,
      isActive: device?.isActive ?? true,
    });
    await refresh();
  };

  // Seleciona o beacon ativo e notifica o ESP32
  const handleSelectBeacon = async (name) => {
    setSelectedBeacon(name);
    if (name) {
      try {
        await createDevice(name); // reutiliza o endpoint que publica no MQTT
      } catch (err) {
        console.error("Erro ao selecionar beacon:", err);
      }
    }
  };

  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`Excluir o dispositivo "${device.name}"?`)) return;
    try {
      await deleteDevice(device._id);
      await refresh();
    } catch (err) {
      console.error("Erro ao excluir dispositivo:", err);
      alert("Erro ao excluir dispositivo.");
    }
  };

  return {
    devices,
    selectedBeacon,
    setSelectedBeacon,
    refresh,
    handleCreateDevice,
    handleUpdateDevice,
    handleSelectBeacon,
    handleDeleteDevice,
  };
};

export default useDevices;
