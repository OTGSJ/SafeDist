import apiClient from "./apiClient";

export const loginUser = async (name, password) => {
  const { data } = await apiClient.post("/users/login", { name, password });
  return data;
};

export const registerUser = async (name, password) => {
  const { data } = await apiClient.post("/users/register", { name, password });
  return data;
};
