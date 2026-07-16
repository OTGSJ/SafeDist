import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  BarChart2,
  Radio,
  Users,
  LogOut,
  Play,
  Square,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";

import { sendScannerControl } from "../../api/devicesApi";
import useDistance from "../../hooks/useDistance";
import useDevices from "../../hooks/useDevices";
import useUsers from "../../hooks/useUsers";

import DistanceChart from "../../components/DistanceChart/DistanceChart";
import Modal from "../../components/Modal/Modal";

import "./Dashboard.css";

/* ═══════════════════════════════════════════════════════════════════════════
   Tab: Estatísticas
   ═══════════════════════════════════════════════════════════════════════════ */
const StatsTab = ({ data, status, lastDistance, handleClearHistory }) => {
  const handleControl = async (command) => {
    try {
      await sendScannerControl(command);
    } catch (err) {
      console.error("Erro ao enviar comando:", err);
    }
  };

  return (
    <div className="tab-panel tab-panel--fill">
      <div className="stats__topbar">
        <span
          className="stats__status-pill"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
        <span className="stats__distance-label">
          {lastDistance !== null ? `${lastDistance.toFixed(2)} m` : "– m"}
        </span>
        <div className="stats__actions">
          <button className="btn btn-success btn--sm" onClick={() => handleControl("START")}>
            <Play size={14} /> Iniciar
          </button>
          <button className="btn btn-danger btn--sm" onClick={() => handleControl("STOP")}>
            <Square size={14} /> Parar
          </button>
          <button className="btn btn-outline-danger btn--sm" onClick={handleClearHistory}>
            <Trash2 size={14} /> Limpar
          </button>
        </div>
      </div>

      <div className="stats__chart-card">
        <div className="stats__chart-header">
          <div>
            <h3 className="stats__chart-title">Telemetria de Proximidade</h3>
            <span className="stats__chart-subtitle">
              Tempo Real — atualiza a cada 3s
            </span>
          </div>
          <div className="stats__chart-legend">
            <span className="stats__chart-dot" />
            Distância (m)
          </div>
        </div>
        <div className="stats__chart-body">
          <DistanceChart data={data} />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Modal: Beacon (criar / editar)
   ═══════════════════════════════════════════════════════════════════════════ */
const BeaconModal = ({ isOpen, mode, beacon, onClose, onCreate, onUpdate }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Preenche o formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      setName(mode === "edit" && beacon ? beacon.name : "");
      setError("");
    }
  }, [isOpen, mode, beacon]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      if (mode === "edit") {
        await onUpdate(beacon._id, name, beacon);
      } else {
        await onCreate(name);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao salvar beacon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={mode === "edit" ? "Editar Beacon" : "Novo Beacon"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <p className="modal-error">{error}</p>}
          <div>
            <label className="form-label">Nome do Beacon</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: BEACON_ZONA_A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Tab: Beacons
   ═══════════════════════════════════════════════════════════════════════════ */
const BeaconsTab = ({ devicesHook }) => {
  const {
    devices,
    selectedBeacon,
    handleCreateDevice,
    handleUpdateDevice,
    handleSelectBeacon,
    handleDeleteDevice,
  } = devicesHook;

  const [modal, setModal] = useState({ open: false, mode: "create", beacon: null });

  const openCreate = () => setModal({ open: true, mode: "create", beacon: null });
  const openEdit = (beacon) => setModal({ open: true, mode: "edit", beacon });
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <div className="tab-panel tab-panel--scrollable">
      {/* Toolbar: seletor de alvo + botão Novo */}
      <div className="tab-toolbar">
        <div className="tab-toolbar__left">
          <span className="tab-toolbar__label">Alvo Ativo:</span>
          <select
            className="form-select tab-toolbar__select"
            value={selectedBeacon}
            onChange={(e) => handleSelectBeacon(e.target.value)}
          >
            <option value="">Selecione um beacon...</option>
            {devices.map((dev) => (
              <option key={dev._id} value={dev.name}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn--sm" onClick={openCreate}>
          <Plus size={14} /> Novo Beacon
        </button>
      </div>

      {/* Tabela de beacons */}
      <div className="card">
        <h3 className="card-title">
          <Radio size={18} /> Beacons Cadastrados
          <span style={{ marginLeft: "auto", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {devices.length} {devices.length === 1 ? "dispositivo" : "dispositivos"}
          </span>
        </h3>

        {devices.length === 0 ? (
          <p style={{ color: "var(--color-text-subtle)", fontSize: "0.875rem", paddingTop: "8px" }}>
            Nenhum beacon cadastrado ainda.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((dev) => (
                  <tr key={dev._id}>
                    <td style={{ fontWeight: 500 }}>{dev.name}</td>
                    <td>
                      <span className={`status-badge ${dev.isActive ? "status-badge--active" : "status-badge--inactive"}`}>
                        <span className="status-badge__dot" />
                        {dev.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="data-table__actions">
                        <button
                          className="data-table__btn data-table__btn--edit"
                          onClick={() => openEdit(dev)}
                        >
                          <Pencil size={13} style={{ marginRight: 4 }} />
                          Editar
                        </button>
                        <button
                          className="data-table__btn data-table__btn--delete"
                          onClick={() => handleDeleteDevice(dev)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BeaconModal
        isOpen={modal.open}
        mode={modal.mode}
        beacon={modal.beacon}
        onClose={closeModal}
        onCreate={handleCreateDevice}
        onUpdate={handleUpdateDevice}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Modal: Usuário (criar / editar)
   ═══════════════════════════════════════════════════════════════════════════ */
const UserModal = ({ isOpen, mode, user, onClose, onCreate, onUpdate }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(mode === "edit" && user ? user.name : "");
      setPassword("");
      setError("");
    }
  }, [isOpen, mode, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (mode === "create" && !password.trim()) { setError("A senha é obrigatória."); return; }
    setSaving(true);
    setError("");
    try {
      if (mode === "edit") {
        await onUpdate(user.id, name, password);
      } else {
        await onCreate(name, password);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={mode === "edit" ? "Editar Usuário" : "Novo Usuário"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <p className="modal-error">{error}</p>}
          <div>
            <label className="form-label">Nome</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nome do usuário"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">
              {mode === "edit" ? "Nova Senha" : "Senha"}
            </label>
            <input
              className="form-input"
              type="password"
              placeholder={mode === "edit" ? "Deixe vazio para não alterar" : "Senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Tab: Usuários
   ═══════════════════════════════════════════════════════════════════════════ */
const UsersTab = ({ usersHook }) => {
  const { users, loading, handleCreateUser, handleUpdateUser, handleDeleteUser } = usersHook;

  const [modal, setModal] = useState({ open: false, mode: "create", user: null });

  const openCreate = () => setModal({ open: true, mode: "create", user: null });
  const openEdit = (user) => setModal({ open: true, mode: "edit", user });
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <div className="tab-panel tab-panel--scrollable">
      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-toolbar__left">
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {loading ? "Carregando..." : `${users.length} ${users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}`}
          </span>
        </div>
        <button className="btn btn-primary btn--sm" onClick={openCreate}>
          <Plus size={14} /> Novo Usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="card">
        <h3 className="card-title">
          <Users size={18} /> Usuários Cadastrados
        </h3>

        {!loading && users.length === 0 ? (
          <p style={{ color: "var(--color-text-subtle)", fontSize: "0.875rem", paddingTop: "8px" }}>
            Nenhum usuário cadastrado ainda.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Cadastrado em</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--color-text-subtle)", width: "40px" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div className="data-table__name-cell">
                        <span className="data-table__avatar">{u.name.charAt(0)}</span>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td>
                      <div className="data-table__actions">
                        <button
                          className="data-table__btn data-table__btn--edit"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={13} style={{ marginRight: 4 }} />
                          Editar
                        </button>
                        <button
                          className="data-table__btn data-table__btn--delete"
                          onClick={() => handleDeleteUser(u)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        isOpen={modal.open}
        mode={modal.mode}
        user={modal.user}
        onClose={closeModal}
        onCreate={handleCreateUser}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard (Shell)
   ═══════════════════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "stats",   label: "Estatísticas", icon: BarChart2, subtitle: "Monitoramento de distância em tempo real" },
  { id: "beacons", label: "Beacons",       icon: Radio,    subtitle: "Gerencie os dispositivos beacon cadastrados" },
  { id: "users",   label: "Usuários",      icon: Users,    subtitle: "Visualize e gerencie os usuários do sistema" },
];

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("stats");

  const { data, status, lastDistance, handleClearHistory } = useDistance();
  const devicesHook = useDevices();
  const usersHook = useUsers();

  const { refresh: refreshDevices } = devicesHook;
  const { refresh: refreshUsers } = usersHook;

  useEffect(() => { refreshDevices(); }, [refreshDevices]);
  useEffect(() => {
    if (activeTab === "users") refreshUsers();
  }, [activeTab, refreshUsers]);

  const activeNavItem = NAV_ITEMS.find((i) => i.id === activeTab);

  return (
    <div className="dashboard">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <ShieldCheck size={26} color="var(--color-success)" />
          <div className="sidebar__brand-info">
            <span className="sidebar__brand-name">SafeDist</span>
            <span className="sidebar__brand-version">v1.0</span>
          </div>
        </div>

        <div className="sidebar__user">
          Conectado como
          <span className="sidebar__user-name">{user.name}</span>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar__nav-item${activeTab === id ? " sidebar__nav-item--active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* ── Área de conteúdo ──────────────────────────────────────────────── */}
      <div className="dashboard__content">
        <div className="content__header">
          <div className="content__header-main">
            <div>
              <div className="content__title">{activeNavItem?.label}</div>
              <div className="content__subtitle">{activeNavItem?.subtitle}</div>
            </div>
            <button className="content__mobile-logout" onClick={onLogout} aria-label="Sair da Conta">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="content__body">
          {activeTab === "stats" && (
            <StatsTab
              data={data}
              status={status}
              lastDistance={lastDistance}
              handleClearHistory={handleClearHistory}
            />
          )}
          {activeTab === "beacons" && (
            <BeaconsTab devicesHook={devicesHook} />
          )}
          {activeTab === "users" && (
            <UsersTab usersHook={usersHook} />
          )}
        </div>
      </div>

      {/* Navigation for mobile screens */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`bottom-nav__item${activeTab === id ? " bottom-nav__item--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={20} />
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;
