# SafeDist — Sistema de Monitoramento de Proximidade

O **SafeDist** é uma solução completa de IoT para monitorar o distanciamento entre operários ou equipamentos em ambientes industriais.

O sistema utiliza a força do sinal Bluetooth (RSSI) para estimar distâncias, processa esses dados em tempo real num microcontrolador **ESP32** e os envia para uma plataforma web via protocolo **MQTT**.

---

## 🏗️ Arquitetura do Projeto

```
SafeDist/
├── firmware_beacon/      # ESP32 secundário — emite sinal BLE
├── firmware_scanner/     # ESP32 principal  — escaneia, calcula, publica MQTT
├── backend/              # API REST + MQTT bridge (Node.js / Express)
└── frontend/             # Dashboard React (SPA)
```

### Fluxo de dados

```
[Beacon ESP32] --BLE--> [Scanner ESP32] --MQTT--> [Backend] --REST--> [Frontend]
```

1. O **Beacon** (ESP32 secundário) anuncia pacotes BLE continuamente.
2. O **Scanner** (ESP32 principal) lê o RSSI, calcula a distância via modelo log-distância e publica no tópico `home/distancia` do broker MQTT.
3. O **Backend** assina esse tópico, salva cada leitura no **MongoDB** e expõe uma API REST.
4. O **Frontend** consulta a API a cada 3 s e exibe os dados no dashboard.

---

## 🛠️ Tecnologias

### Firmware (ESP32)
| Componente | Tecnologia |
|---|---|
| Microcontrolador | ESP32-WROOM-32 |
| Framework | ESP-IDF v5.5.1 |
| Stack Bluetooth | NimBLE (GAP) |
| Protocolo de rede | MQTT (TCP) |

### Backend (Node.js)
| Componente | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| BD — Distâncias e Dispositivos | MongoDB (Mongoose) |
| BD — Usuários | SQLite (Sequelize) |
| MQTT | biblioteca `mqtt` |
| Configuração | `dotenv` |

### Frontend (React)
| Componente | Tecnologia |
|---|---|
| Biblioteca | React 19 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| HTTP client | Axios |

---

## 📁 Estrutura Interna

### Backend (`backend/`)
```
backend/
├── .env                        # Variáveis de ambiente (não commitado)
├── server.js                   # Entry point — bootstrap apenas
└── src/
    ├── config/
    │   ├── database.js         # Conexão SQLite (Sequelize)
    │   └── mongodb.js          # Conexão MongoDB
    ├── models/
    │   ├── Device.js           # Mongoose — dispositivos beacon
    │   ├── Distance.js         # Mongoose — leituras de distância
    │   └── User.js             # Sequelize — usuários do sistema
    ├── controllers/            # Lógica de negócio
    │   ├── DeviceController.js
    │   ├── DistanceController.js
    │   └── UserController.js
    ├── routes/                 # Apenas roteamento
    │   ├── DeviceRoutes.js
    │   ├── DistanceRoutes.js
    │   ├── ScannerRoutes.js
    │   └── UserRoutes.js
    └── services/
        └── MqttService.js      # Subscriber MQTT → salva no MongoDB
```

### Frontend (`frontend/src/`)
```
src/
├── api/              # Chamadas HTTP (Axios) por domínio
│   ├── apiClient.js  # Instância central com baseURL
│   ├── authApi.js
│   ├── devicesApi.js
│   ├── distanceApi.js
│   └── usersApi.js
├── hooks/            # Estado e efeitos isolados por domínio
│   ├── useAuth.js
│   ├── useDevices.js
│   ├── useDistance.js
│   └── useUsers.js
├── components/       # Componentes reutilizáveis (cada um com CSS próprio)
│   ├── DistanceChart/
│   ├── DeviceManager/
│   ├── Login/
│   └── StatusCard/
├── pages/
│   └── Dashboard/    # Página principal com sidebar de navegação
└── styles/
    └── global.css    # Design tokens (variáveis CSS) e reset
```

---

## 📡 API REST

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/distance/history` | Últimas 50 leituras de distância |
| `DELETE` | `/api/distance/clear` | Apaga todo o histórico |
| `GET` | `/api/devices` | Lista dispositivos beacon |
| `POST` | `/api/devices` | Cadastra beacon e notifica ESP32 via MQTT |
| `PUT` | `/api/devices/:id` | Atualiza nome/status do beacon |
| `DELETE` | `/api/devices/:id` | Remove beacon |
| `POST` | `/api/scanner/control` | Envia `START` ou `STOP` ao ESP32 via MQTT |
| `POST` | `/api/users/login` | Autenticação |
| `POST` | `/api/users/register` | Cadastro de novo usuário |
| `GET` | `/api/users` | Lista todos os usuários |
| `DELETE` | `/api/users/:id` | Remove usuário |
| `POST` | `/api/led-command` | Envia comando de LED ao ESP32 (legado) |

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **ESP-IDF v5.5.1** configurado (para o firmware)
- Conta no **MongoDB Atlas** (ou MongoDB local)

### 1. Backend

```bash
cd backend
npm install
```

Crie o arquivo `backend/.env` com as variáveis abaixo:

```env
PORT=3001
MONGO_URI=mongodb+srv://<usuario>:<senha>@cluster.mongodb.net/
MQTT_BROKER=mqtt://test.mosquitto.org
```

> ⚠️ O arquivo `.env` já está no `.gitignore` — nunca o commite.

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Firmware — Scanner (ESP32 principal)

No arquivo `app_main.c`, configure:
```c
#define WIFI_SSID   "SuaRedeWifi"
#define WIFI_PASS   "SuaSenha"
#define BROKER_URI  "mqtt://test.mosquitto.org"
```

**Compilar e gravar:**
```bash
idf.py menuconfig   # Habilite Bluetooth → Host: NimBLE
idf.py build
idf.py -p COMx flash monitor
```

Ou, na extensão ESP-IDF do VS Code: **Build → Flash → Monitor**.

---

## ▶️ Como Rodar

Siga esta ordem para garantir que tudo se conecte corretamente:

### Passo 1 — Iniciar o Backend
```bash
cd backend
npm start
```
Saída esperada:
```
🚀 Backend rodando em http://localhost:3001
📦 SQLite inicializado
🍃 MongoDB conectado com sucesso
🔗 Conectado ao Broker MQTT
```

### Passo 2 — Iniciar o Frontend
```bash
cd frontend
npm start
```
Acesse: **http://localhost:3000**

### Passo 3 — Ligar os ESP32
1. Conecte o **Beacon** (ESP32 secundário) — ele começa a anunciar BLE automaticamente.
2. Conecte o **Scanner** (ESP32 principal) — ele se conecta ao Wi-Fi e ao MQTT.

---

## 📊 Como Usar o Dashboard

O dashboard possui um menu lateral com três abas:

| Aba | Funcionalidade |
|---|---|
| **Estatísticas** | Gráfico de distância em tempo real, status do sistema (Seguro / Alerta / Perigo), botões **Iniciar**, **Parar** e **Limpar histórico** |
| **Beacons** | Cadastrar, selecionar, editar e excluir dispositivos beacon. O nome cadastrado é sincronizado com o ESP32 via MQTT. |
| **Usuários** | Listar e excluir usuários do sistema |

### Primeiro uso
1. Crie uma conta em **Login → Registrar Conta**.
2. Faça login.
3. Na aba **Beacons**, cadastre o nome do beacon (ex: `ESP32_BEACON_BLE`) e selecione-o.
4. Na aba **Estatísticas**, clique em **Iniciar** — o ESP32 receberá o comando via MQTT e começará o escaneamento.
5. Observe o gráfico atualizar a cada 3 segundos.

### Limites de alerta
| Distância | Status | Indicador |
|---|---|---|
| ≥ 2,5 m | 🟢 **Sistema Seguro** | Verde |
| 1,0 – 2,5 m | 🟡 **Alerta de Proximidade** | Amarelo |
| < 1,0 m | 🔴 **Perigo Crítico** | Vermelho |

---

## 🔗 Tópicos MQTT

| Tópico | Direção | Conteúdo |
|---|---|---|
| `home/distancia` | ESP32 → Backend | `{ "distancia": 1.5, "rssi": -65, "id": "ESP32_BEACON" }` |
| `home/scanner/command` | Backend → ESP32 | `"START"` ou `"STOP"` |
| `home/scanner/config` | Backend → ESP32 | Nome do beacon alvo |
| `home/led/command` | Backend → ESP32 | `"ON"` ou `"OFF"` |

---

*Projeto de integração Web, Embarcado e Banco de Dados.*