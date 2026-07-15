import React from "react";
import { Activity, ShieldCheck, AlertCircle } from "lucide-react";
import "./StatusCard.css";

const STATUS_ICONS = {
  critical: <AlertCircle />,
  warning: <AlertCircle />,
  safe: <ShieldCheck />,
  idle: <Activity />,
};

const StatusCard = ({ status, lastDistance }) => {
  const icon = STATUS_ICONS[status.type] ?? <Activity />;

  return (
    <div className="card">
      <h3 className="card-title">
        <Activity size={20} /> Status Atual
      </h3>

      <div
        className="status-card__indicator"
        style={{ backgroundColor: status.color }}
      >
        <div className="status-card__icon">{icon}</div>
        <div className="status-card__label">{status.label}</div>
      </div>

      <p className="status-card__distance">
        {lastDistance !== null
          ? `${lastDistance.toFixed(2)}m de distância`
          : "Aguardando sinal..."}
      </p>
    </div>
  );
};

export default StatusCard;
