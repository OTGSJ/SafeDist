import { useState, useEffect, useCallback } from "react";
import { fetchHistory, clearHistory } from "../api/distanceApi";

const STATUS_LEVELS = {
  critical: { label: "PERIGO CRÍTICO", color: "#ef4444", type: "critical" },
  warning: { label: "ALERTA DE PROXIMIDADE", color: "#f59e0b", type: "warning" },
  safe: { label: "SISTEMA SEGURO", color: "#10b981", type: "safe" },
  idle: { label: "Sincronizando...", color: "#666", type: "idle" },
};

const resolveStatus = (distance) => {
  if (distance < 1.0) return STATUS_LEVELS.critical;
  if (distance < 2.5) return STATUS_LEVELS.warning;
  return STATUS_LEVELS.safe;
};

const formatData = (history) =>
  history
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp || item.createdAt).toLocaleTimeString(),
      distancia: item.distancia,
    }));

const useDistance = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState(STATUS_LEVELS.idle);

  const refresh = useCallback(async () => {
    try {
      const history = await fetchHistory();
      setData(formatData(history));

      if (history.length > 0) {
        const lastDist = history[0].distancia; // history is sorted desc
        setStatus(resolveStatus(lastDist));
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm("Limpar todo o histórico de medições?")) return;
    try {
      await clearHistory();
      setData([]);
    } catch (err) {
      console.error("Erro ao limpar histórico:", err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const lastDistance = data.length > 0 ? data[data.length - 1].distancia : null;

  return { data, status, lastDistance, handleClearHistory };
};

export default useDistance;
