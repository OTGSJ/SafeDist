import apiClient from "./apiClient";

export const fetchUsers = async () => {
  const { data } = await apiClient.get("/users");
  return data;
};

export const createUser = async (name, password) => {
  const { data } = await apiClient.post("/users/register", { name, password });
  return data;
};

export const updateUser = async (id, name, password) => {
  const { data } = await apiClient.put(`/users/${id}`, { name, password });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
};
