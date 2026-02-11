# SafeDist - Sistema de Monitoramento de Proximidade entre dispositivos

O **SafeDist** é uma solução completa de IoT projetada para monitorar o distanciamento entre operários ou equipamentos em ambientes industriais.  

O sistema utiliza a força do sinal Bluetooth (RSSI) para estimar distâncias, processa esses dados em tempo real em um microcontrolador **ESP32** e os envia para uma plataforma web via protocolo **MQTT**.

## 🚀 Arquitetura do Projeto

O projeto é dividido em três pilares fundamentais:

1. **Embarcados** (`firmware/`)
   - **Beacon**: ESP32 que atua como ponto de referência, emitindo pacotes de anúncio BLE.
   - **Scanner**: ESP32 principal que escaneia o sinal, calcula a distância usando o modelo log-distância e gerencia a coexistência entre os rádios Wi-Fi e Bluetooth.

2. **Backend** (`backend/`)  
   Servidor Node.js que atua como ponte entre o Broker MQTT e o banco de dados NoSQL, fornecendo uma API REST para o dashboard.

3. **Frontend** (`frontend/`)  
   Painel administrativo em React com:
   - Controle remoto do hardware
   - Gerenciamento de dispositivos (CRUD)
   - Visualização de telemetria em tempo real

## 🛠️ Tecnologias e Dependências

### Hardware / Firmware
- Microcontrolador: **ESP32 (WROOM-32)**
- Framework: **ESP-IDF v5.5.1**
- Stack Bluetooth: **NimBLE** (mais eficiente em memória)
- Protocolos: **MQTT (TCP)** e **BLE (GAP)**

### Backend
- Ambiente: **Node.js**
- Framework Web: **Express**
- Banco de Dados: **MongoDB** (Mongoose ODM)
- Comunicação: Biblioteca **mqtt**

### Frontend
- Biblioteca: **React v19**
- Gráficos: **Recharts** (visualização multilinhas)
- Ícones: **Lucide-react**

## 📦 Instalação e Configuração

### 1. Requisitos Prévios
- ESP-IDF v5.5.1 instalado e configurado no VS Code
- Node.js instalado
- Conta no **MongoDB Atlas** (ou MongoDB local)

### 2. Configuração do Backend
```
cd backend
npm install
```

* No arquivo server.js, configure sua MONGO_URI com suas credenciais do MongoDB Atlas.
* Verifique se o `BROKER_URI` está apontando corretamente para mqtt://{Url do broker}.

### 3. Configuração do Frontend
```
cd frontend
npm install
```

### 4. Configuração do Firmware (Scanner)
* No arquivo app_main.c, ajuste as variáveis WIFI_SSID e WIFI_PASS com os dados da sua rede.
* Verifique se o `BROKER_URI` é o mesmo configurado no backend.
* **Compilação:**
    *`idf.py menuconfig` (Habilite o Bluetooth e selecione o Host **NimBLE**).
    *`idf.py build`
    *`idf.py -p COMx flash monitor`

* Ou caso já tenha instalado e configurado a extensão ESP-IDF, simplesmente use a opção:
> Build, Flash, Monitor.

### 5. Execução do Sistema
Para que o projeto funcione por completo, siga esta ordem de inicialização:
1. **Ligar o Beacon:** Conecte o ESP32 secundário (ele começará a anunciar automaticamente).
2. **Iniciar o Backend:**
```
cd backend
npm start
```
3. **Iniciar o Backend:**
```
cd frontend
npm start
```

4. **Ligar o Scanner:** Conecte o ESP32 principal ao computador.

### 6. Como utilizar o Dashboard:
1. **CRUD:** Digite o nome do beacon (`ESP32_BEACON_BLE`) no campo de cadastro e clique em salvar. Isso sincroniza o nome via banco de dados com a memória do ESP32.

2. **Controle:** Clique em **INICIAR SISTEMA**. O ESP32 receberá o comando via MQTT e começará o escaneamento Bluetooth.

3. **Monitoramento:** Observe o gráfico multilinhas. Se houver mais de um beacon cadastrado, o gráfico exibirá curvas distintas para cada dispositivo.

4. **Segurança:** Se a distância for menor que 1.5m, o LED (GPIO 13) no ESP32 piscará e o status no dashboard mudará para **PERIGO**.

Projeto de integração Web, Embarcado e Banco de dados.