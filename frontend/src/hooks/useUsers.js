import { useState, useCallback } from "react";
import { fetchUsers, createUser, updateUser, deleteUser } from "../api/usersApi";

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateUser = async (name, password) => {
    await createUser(name, password);
    await refresh();
  };

  const handleUpdateUser = async (id, name, password) => {
    await updateUser(id, name, password);
    await refresh();
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Excluir o usuário "${user.name}"?`)) return;
    try {
      await deleteUser(user.id);
      await refresh();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Erro ao excluir usuário.");
    }
  };

  return { users, loading, refresh, handleCreateUser, handleUpdateUser, handleDeleteUser };
};

export default useUsers;
