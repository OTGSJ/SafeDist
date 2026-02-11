import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertCircle, Settings, Play, Square, Trash2, RefreshCw } from 'lucide-react';
import DistanceChart from './components/DistanceChart';

const App = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ label: 'Sincronizando...', color: '#666', icon: <Activity /> });
  const [devices, setDevices] = useState([]);
  const [selectedBeacon, setSelectedBeacon] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");

  // Busca histórico e lista de dispositivos
  const fetchAllData = async () => {
    try {
      // 1. Histórico para o gráfico
      const resHistory = await fetch('http://localhost:3001/api/distance/history');
      const history = await resHistory.json();
      const formattedData = history.reverse().map(item => ({
        time: new Date(item.timestamp || item.createdAt).toLocaleTimeString(),
        distancia: item.distancia,
      }));
      setData(formattedData);

      // Atualiza Status Visual
      if (history.length > 0) {
        const lastDist = history[history.length - 1].distancia;
        if (lastDist < 1.0) setStatus({ label: 'PERIGO CRÍTICO', color: '#ef4444', icon: <AlertCircle /> });
        else if (lastDist < 2.5) setStatus({ label: 'ALERTA DE PROXIMIDADE', color: '#f59e0b', icon: <AlertCircle /> });
        else setStatus({ label: 'SISTEMA SEGURO', color: '#10b981', icon: <ShieldCheck /> });
      }

      // 2. Lista de dispositivos para o Seletor
      const resDevices = await fetch('http://localhost:3001/api/devices');
      const devicesList = await resDevices.json();
      setDevices(devicesList);
    } catch (error) {
      console.error("Erro na comunicação com o backend:", error);
    }
  };

  const sendControl = async (command) => {
    await fetch('http://localhost:3001/api/scanner/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
  };

  const handleConfigBeacon = async (name) => {
    if (!name) return;
    try {
      const response = await fetch('http://localhost:3001/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (response.ok) {
        alert(`Sucesso: ESP32 agora focado em ${name}`);
        setNewDeviceName(""); // Limpa o input
        fetchAllData();      // <--- ISSO faz o seletor atualizar na hora!
      }
    } catch (error) {
      console.error("Erro ao configurar beacon:", error);
    }
  };

  const clearDb = async () => {
    if(window.confirm("Limpar todo o histórico de medições?")) {
      await fetch('http://localhost:3001/api/distance/clear', { method: 'DELETE' });
      setData([]);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header Profissional */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#10b981" /> SafeDist <span style={{fontSize: '0.8rem', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px'}}>v1.0</span>
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Monitoramento Proximidade entre Dispositivos</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => sendControl('START')} style={{ border: 'none', backgroundColor: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Play size={16} /> INICIAR
          </button>
          <button onClick={() => sendControl('STOP')} style={{ border: 'none', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Square size={16} /> PARAR
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' }}>
        
        {/* Coluna Lateral: Status e Configurações */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Card de Status */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} /> Status Atual
            </h3>
            <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: status.color, color: 'white', textAlign: 'center', transition: 'all 0.5s ease' }}>
              <div style={{ marginBottom: '5px' }}>{status.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{status.label}</div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#64748b', fontWeight: '500' }}>
              {data.length > 0 ? `${data[data.length-1].distancia.toFixed(2)}m de distância` : 'Aguardando sinal...'}
            </p>
          </div>

          {/* Card de Configuração (CRUD) */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={20} /> Configuração de Alvo
            </h3>
            
            {/* Seletor de Beacons Cadastrados */}
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>SELECIONAR CADASTRADO</label>
            <select 
              value={selectedBeacon} 
              onChange={(e) => { setSelectedBeacon(e.target.value); handleConfigBeacon(e.target.value); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px', marginBottom: '20px', backgroundColor: '#f8fafc' }}
            >
              <option value="">Selecione um Beacon...</option>
              {devices.map(dev => <option key={dev} value={dev}>{dev}</option>)}
            </select>

            {/* Cadastro de Novo */}
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>CADASTRAR NOVO NOME</label>
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
              <input 
                value={newDeviceName} 
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Ex: BEACON_ZONA_A" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <button onClick={() => handleConfigBeacon(newDeviceName)} style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          <button onClick={clearDb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
            <Trash2 size={18} /> LIMPAR HISTÓRICO
          </button>

        </aside>

        {/* Gráfico Principal */}
        <main style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Telemetria de Proximidade (Tempo Real)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.8rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8884d8' }}></div> Distância (m)</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '400px' }}>
            <DistanceChart data={data} />
          </div>
        </main>

      </div>
    </div>
  );
};

export default App;