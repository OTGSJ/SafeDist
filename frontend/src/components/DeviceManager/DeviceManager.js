import React from "react";
import { Settings, RefreshCw } from "lucide-react";
import "./DeviceManager.css";

/* ─── Beacon Selector ─────────────────────────────────────────────────────── */
export const BeaconSelector = ({
  devices,
  selectedBeacon,
  setSelectedBeacon,
  newDeviceName,
  setNewDeviceName,
  handleConfigBeacon,
}) => (
  <div className="card">
    <h3 className="card-title">
      <Settings size={20} /> Configuração de Alvo
    </h3>

    <label className="form-label">Selecionar Cadastrado</label>
    <select
      className="form-select"
      value={selectedBeacon}
      style={{ marginTop: "5px", marginBottom: "20px" }}
      onChange={(e) => {
        setSelectedBeacon(e.target.value);
        handleConfigBeacon(e.target.value);
      }}
    >
      <option value="">Selecione um Beacon...</option>
      {devices.map((dev) => (
        <option key={dev._id} value={dev.name}>
          {dev.name}
        </option>
      ))}
    </select>

    <label className="form-label">Cadastrar Novo Nome</label>
    <div className="device-manager__row">
      <input
        className="form-input"
        value={newDeviceName}
        onChange={(e) => setNewDeviceName(e.target.value)}
        placeholder="Ex: BEACON_ZONA_A"
        onKeyDown={(e) => e.key === "Enter" && handleConfigBeacon(newDeviceName)}
      />
      <button
        className="device-manager__add-btn"
        onClick={() => handleConfigBeacon(newDeviceName)}
        title="Cadastrar"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  </div>
);

/* ─── Device Table ────────────────────────────────────────────────────────── */
export const DeviceTable = ({
  devices,
  editingDevice,
  editName,
  setEditName,
  startEditDevice,
  cancelEditDevice,
  saveEditDevice,
  handleDeleteDevice,
}) => (
  <div className="card">
    <h3 className="card-title">
      <Settings size={20} /> Dispositivos Cadastrados
    </h3>

    {devices.length === 0 ? (
      <p className="device-manager__empty">Nenhum dispositivo cadastrado ainda.</p>
    ) : (
      <table className="device-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((dev) => {
            const isEditing = editingDevice && editingDevice._id === dev._id;
            return (
              <tr key={dev._id}>
                <td>
                  {isEditing ? (
                    <input
                      className="device-table__edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    dev.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <>
                      <button
                        className="device-table__action-btn device-table__action-btn--save"
                        onClick={saveEditDevice}
                      >
                        Salvar
                      </button>
                      <button
                        className="device-table__action-btn device-table__action-btn--cancel"
                        onClick={cancelEditDevice}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="device-table__action-btn device-table__action-btn--edit"
                        onClick={() => startEditDevice(dev)}
                      >
                        Editar
                      </button>
                      <button
                        className="device-table__action-btn device-table__action-btn--delete"
                        onClick={() => handleDeleteDevice(dev)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);
