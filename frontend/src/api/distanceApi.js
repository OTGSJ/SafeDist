import apiClient from "./apiClient";

export const fetchHistory = async () => {
  const { data } = await apiClient.get("/distance/history");
  return data;
};

export const clearHistory = async () => {
  const { data } = await apiClient.delete("/distance/clear");
  return data;
};
