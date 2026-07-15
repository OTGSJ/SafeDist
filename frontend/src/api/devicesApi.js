import apiClient from "./apiClient";

export const listDevices = async () => {
  const { data } = await apiClient.get("/devices");
  return data;
};

export const createDevice = async (name) => {
  const { data } = await apiClient.post("/devices", { name });
  return data;
};

export const updateDevice = async (id, payload) => {
  const { data } = await apiClient.put(`/devices/${id}`, payload);
  return data;
};

export const deleteDevice = async (id) => {
  const { data } = await apiClient.delete(`/devices/${id}`);
  return data;
};

export const sendScannerControl = async (command) => {
  const { data } = await apiClient.post("/scanner/control", { command });
  return data;
};
