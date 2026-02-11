#include <stdio.h>
#include <string.h>
#include <math.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "mqtt_client.h"
#include "driver/gpio.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"

#ifndef MIN
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#endif

#define LED_GPIO            13
#define BROKER_URI          "mqtt://test.mosquitto.org"
#define MEASURED_POWER      -75
#define N_COEFF             3.0
#define SCAN_DURATION_MS    1000
#define SCAN_INTERVAL_MS    3000

static const char *TAG = "SAFEDIST_SCANNER_PRO";

// --- VARIÁVEIS DINÂMICAS (CRUD / CONTROLE) ---
static char target_beacon[32] = "ESP32_BEACON_BLE"; 
static bool is_measuring = false;
static esp_mqtt_client_handle_t mqtt_client;
static bool mqtt_connected = false;

static float calculate_distance(int8_t rssi) {
    if (rssi >= 0 || rssi <= -100) return -1.0f;
    return powf(10.0f, (float)(MEASURED_POWER - rssi) / (10.0f * N_COEFF));
}

// Callback GAP BLE: Processa dispositivos encontrados
static int ble_gap_event(struct ble_gap_event *event, void *arg) {
    if (event->type == BLE_GAP_EVENT_DISC) {
        struct ble_hs_adv_fields fields;
        if (ble_hs_adv_parse_fields(&fields, event->disc.data, event->disc.length_data) == 0) {
            if (fields.name != NULL && strncmp((char*)fields.name, target_beacon, fields.name_len) == 0) {
                
                float dist = calculate_distance(event->disc.rssi);
                
                if (is_measuring && mqtt_connected) {
                    char payload[128];
                    snprintf(payload, sizeof(payload), 
                             "{\"distancia\":%.2f,\"rssi\":%d,\"id\":\"ESP32_Scanner\"}", 
                             dist, event->disc.rssi);
                    esp_mqtt_client_publish(mqtt_client, "home/distancia", payload, 0, 1, 0);
                    ESP_LOGI(TAG, "Dado Enviado! Alvo: %s | Dist: %.2f m", target_beacon, dist);
                }
                
                gpio_set_level(LED_GPIO, dist < 1.5f);
            }
        }
    }
    return 0;
}

// Task de Scan: Gerencia o ciclo de medição para não travar o Wi-Fi
static void ble_scan_task(void *pvParameters) {
    while (1) {
        if (is_measuring) {
            struct ble_gap_disc_params disc_params = { .filter_duplicates = 1, .passive = 0 };
            ble_gap_disc(BLE_OWN_ADDR_PUBLIC, SCAN_DURATION_MS, &disc_params, ble_gap_event, NULL);
        } else {
            gpio_set_level(LED_GPIO, 0);
        }
        vTaskDelay(pdMS_TO_TICKS(SCAN_INTERVAL_MS));
    }
}

void ble_host_task(void *param) { nimble_port_run(); }

// Handler MQTT: Recebe comandos do Dashboard (START/STOP e NOME)
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;
    switch (event_id) {
        case MQTT_EVENT_CONNECTED:
            mqtt_connected = true;
            esp_mqtt_client_subscribe(mqtt_client, "home/scanner/command", 1);
            esp_mqtt_client_subscribe(mqtt_client, "home/scanner/config", 1);
            ESP_LOGI(TAG, "Conectado ao Broker! Dashboard pronto.");
            break;
        case MQTT_EVENT_DISCONNECTED:
            mqtt_connected = false;
            break;
        case MQTT_EVENT_DATA:
            if (strncmp(event->topic, "home/scanner/command", event->topic_len) == 0) {
                is_measuring = (strncmp(event->data, "START", event->data_len) == 0);
                ESP_LOGW(TAG, "Controle: Medição %s", is_measuring ? "INICIADA" : "PARADA");
            } else if (strncmp(event->topic, "home/scanner/config", event->topic_len) == 0) {
                int len = event->data_len > 31 ? 31 : event->data_len;
                memcpy(target_beacon, event->data, len);
                target_beacon[len] = '\0';
                ESP_LOGW(TAG, "CRUD: Novo alvo definido para: %s", target_beacon);
            }
            break;
        default: break;
    }
}

static void wifi_handler(void* arg, esp_event_base_t base, int32_t id, void* data) {
    if (id == WIFI_EVENT_STA_START || id == WIFI_EVENT_STA_DISCONNECTED) esp_wifi_connect();
    else if (id == IP_EVENT_STA_GOT_IP) esp_mqtt_client_start(mqtt_client);
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    gpio_reset_pin(LED_GPIO);
    gpio_set_direction(LED_GPIO, GPIO_MODE_OUTPUT);

    // 1. Inicializar MQTT primeiro (Evita ponteiro NULL)
    esp_mqtt_client_config_t mqtt_cfg = { .broker.address.uri = BROKER_URI, .session.keepalive = 60 };
    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);

    // 2. Wi-Fi Config
    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);
    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_handler, NULL, NULL);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_handler, NULL, NULL);
    
    wifi_config_t wifi_config = { .sta = { .ssid = "GalaxyA10", .password = "jose1234" } };
    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();

    // 3. Estabilização (Aguardar Wi-Fi e MQTT)
    vTaskDelay(pdMS_TO_TICKS(5000));

    // 4. Bluetooth NimBLE
    nimble_port_init();
    ble_svc_gap_init();
    ble_svc_gap_device_name_set("SafeDist_Scanner_Pro");
    nimble_port_freertos_init(ble_host_task);

    // 5. Iniciar Tasks (A medição agora roda em uma task separada)
    xTaskCreate(ble_scan_task, "ble_scan_task", 4096, NULL, 5, NULL);
}