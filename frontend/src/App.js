import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  Settings,
  Play,
  Square,
  Trash2,
  RefreshCw,
} from "lucide-react";
import DistanceChart from "./components/DistanceChart";
import Login from "./components/Login";

const App = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({
    label: "Sincronizando...",
    color: "#666",
    icon: <Activity />,
  });
  const [devices, setDevices] = useState([]);
  const [selectedBeacon, setSelectedBeacon] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [editingDevice, setEditingDevice] = useState(null); // dispositivo sendo editado (ou null)
  const [editName, setEditName] = useState("");

  // Sessão persistente: recupera o usuário logado do localStorage (sobrevive ao F5)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("safedist_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("safedist_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("safedist_user");
    setUser(null);
  };

  // Busca histórico e lista de dispositivos (Mantido intacto)
  const fetchAllData = async () => {
    try {
      const resHistory = await fetch(
        "http://localhost:3001/api/distance/history",
      );
      const history = await resHistory.json();
      const formattedData = history.reverse().map((item) => ({
        time: new Date(item.timestamp || item.createdAt).toLocaleTimeString(),
        distancia: item.distancia,
      }));
      setData(formattedData);

      if (history.length > 0) {
        const lastDist = history[history.length - 1].distancia;
        if (lastDist < 1.0)
          setStatus({
            label: "PERIGO CRÍTICO",
            color: "#ef4444",
            icon: <AlertCircle />,
          });
        else if (lastDist < 2.5)
          setStatus({
            label: "ALERTA DE PROXIMIDADE",
            color: "#f59e0b",
            icon: <AlertCircle />,
          });
        else
          setStatus({
            label: "SISTEMA SEGURO",
            color: "#10b981",
            icon: <ShieldCheck />,
          });
      }

      const resDevices = await fetch("http://localhost:3001/api/devices");
      const devicesList = await resDevices.json();
      setDevices(devicesList);
    } catch (error) {
      console.error("Erro na comunicação com o backend:", error);
    }
  };

  const sendControl = async (command) => {
    await fetch("http://localhost:3001/api/scanner/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
  };

  const handleConfigBeacon = async (name) => {
    if (!name) return;
    try {
      const response = await fetch("http://localhost:3001/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        alert(`Sucesso: ESP32 agora focado em ${name}`);
        setNewDeviceName("");
        fetchAllData();
      }
    } catch (error) {
      console.error("Erro ao configurar beacon:", error);
    }
  };

  const startEditDevice = (device) => {
    setEditingDevice(device);
    setEditName(device.name);
  };

  const cancelEditDevice = () => {
    setEditingDevice(null);
    setEditName("");
  };

  const saveEditDevice = async () => {
    if (!editName.trim() || !editingDevice) return;
    try {
      const response = await fetch(
        `http://localhost:3001/api/devices/${editingDevice._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            description: editingDevice.description,
            isActive: editingDevice.isActive,
          }),
        },
      );

      if (response.ok) {
        cancelEditDevice();
        fetchAllData();
      } else {
        alert("Erro ao atualizar dispositivo.");
      }
    } catch (error) {
      console.error("Erro ao atualizar dispositivo:", error);
    }
  };

  const deleteDevice = async (device) => {
    if (!window.confirm(`Excluir o dispositivo "${device.name}"?`)) return;
    try {
      const response = await fetch(
        `http://localhost:3001/api/devices/${device._id}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        fetchAllData();
      } else {
        alert("Erro ao excluir dispositivo.");
      }
    } catch (error) {
      console.error("Erro ao excluir dispositivo:", error);
    }
  };

  const clearDb = async () => {
    if (window.confirm("Limpar todo o histórico de medições?")) {
      await fetch("http://localhost:3001/api/distance/clear", {
        method: "DELETE",
      });
      setData([]);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      {/* Header Profissional */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          backgroundColor: "#1e293b",
          padding: "20px",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ShieldCheck size={28} color="#10b981" /> SafeDist{" "}
            <span
              style={{
                fontSize: "0.8rem",
                backgroundColor: "#334155",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
            >
              v1.0
            </span>
          </h1>
          {/* Exibe o nome de quem logou */}
          <p
            style={{
              margin: 5,
              opacity: 0.9,
              fontSize: "0.9rem",
              color: "#10b981",
            }}
          >
            Conectado como: <strong>{user.name}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => sendControl("START")}
            style={{
              border: "none",
              backgroundColor: "#10b981",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "bold",
            }}
          >
            <Play size={16} /> INICIAR
          </button>
          <button
            onClick={() => sendControl("STOP")}
            style={{
              border: "none",
              backgroundColor: "#ef4444",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "bold",
            }}
          >
            <Square size={16} /> PARAR
          </button>
          {/* Botão para deslogar */}
          <button
            onClick={handleLogout}
            style={{
              border: "1px solid #94a3b8",
              backgroundColor: "transparent",
              color: "#94a3b8",
              padding: "10px 15px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            SAIR
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          gap: "25px",
        }}
      >
        {/* Coluna Lateral: Status e Configurações */}
        <aside
          style={{ display: "flex", flexDirection: "column", gap: "25px" }}
        >
          {/* Card de Status */}
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "1.1rem",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Activity size={20} /> Status Atual
            </h3>
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                backgroundColor: status.color,
                color: "white",
                textAlign: "center",
                transition: "all 0.5s ease",
              }}
            >
              <div style={{ marginBottom: "5px" }}>{status.icon}</div>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                {status.label}
              </div>
            </div>
            <p
              style={{
                textAlign: "center",
                marginTop: "15px",
                color: "#64748b",
                fontWeight: "500",
              }}
            >
              {data.length > 0
                ? `${data[data.length - 1].distancia.toFixed(2)}m de distância`
                : "Aguardando sinal..."}
            </p>
          </div>

          {/* Card de Configuração (CRUD) */}
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "1.1rem",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Settings size={20} /> Configuração de Alvo
            </h3>

            <label
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                fontWeight: "bold",
              }}
            >
              SELECIONAR CADASTRADO
            </label>
            <select
              value={selectedBeacon}
              onChange={(e) => {
                setSelectedBeacon(e.target.value);
                handleConfigBeacon(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginTop: "5px",
                marginBottom: "20px",
                backgroundColor: "#f8fafc",
              }}
            >
              <option value="">Selecione um Beacon...</option>
              {devices.map((dev) => (
                <option key={dev._id} value={dev.name}>
                  {dev.name}
                </option>
              ))}
            </select>

            <label
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                fontWeight: "bold",
              }}
            >
              CADASTRAR NOVO NOME
            </label>
            <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
              <input
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Ex: BEACON_ZONA_A"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <button
                onClick={() => handleConfigBeacon(newDeviceName)}
                style={{
                  backgroundColor: "#1e293b",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Tabela de Gerenciamento de Dispositivos (CRUD completo) */}
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "1.1rem",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Settings size={20} /> Dispositivos Cadastrados
            </h3>

            {devices.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                Nenhum dispositivo cadastrado ainda.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px 4px",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                      }}
                    >
                      NOME
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 4px",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                      }}
                    >
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((dev) => (
                    <tr key={dev._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 4px" }}>
                        {editingDevice && editingDevice._id === dev._id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        ) : (
                          dev.name
                        )}
                      </td>
                      <td style={{ padding: "10px 4px", textAlign: "right" }}>
                        {editingDevice && editingDevice._id === dev._id ? (
                          <>
                            <button
                              onClick={saveEditDevice}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#10b981",
                                cursor: "pointer",
                                fontWeight: "bold",
                                marginRight: "10px",
                              }}
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEditDevice}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditDevice(dev)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#3b82f6",
                                cursor: "pointer",
                                fontWeight: "bold",
                                marginRight: "10px",
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteDevice(dev)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontWeight: "bold",
                              }}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button
            onClick={clearDb}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: "transparent",
              color: "#ef4444",
              border: "1px solid #ef4444",
              padding: "12px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            <Trash2 size={18} /> LIMPAR HISTÓRICO
          </button>
        </aside>

        {/* Gráfico Principal */}
        <main
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              Telemetria de Proximidade (Tempo Real)
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#8884d8",
                  }}
                ></div>{" "}
                Distância (m)
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: "400px" }}>
            <DistanceChart data={data} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
