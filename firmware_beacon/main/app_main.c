#include <stdio.h>
#include <string.h>
#include "nvs_flash.h"
#include "esp_log.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"

static const char *TAG = "BLE_BEACON";
#define BEACON_DEVICE_NAME "ESP32_BEACON_BLE"

// Callback de sincronização: Executa quando o stack BLE está pronto
void on_sync(void) {
    uint8_t addr_type;
    int rc;

    // Determina o tipo de endereço (Público ou Aleatório)
    rc = ble_hs_id_infer_auto(0, &addr_type);
    if (rc != 0) {
        ESP_LOGE(TAG, "Erro ao determinar tipo de endereço: %d", rc);
        return;
    }

    struct ble_gap_adv_params adv_params;
    struct ble_hs_adv_fields fields;
    memset(&fields, 0, sizeof(fields));

    // Configura o nome do dispositivo no pacote de anúncio
    fields.name = (uint8_t *)BEACON_DEVICE_NAME;
    fields.name_len = strlen(BEACON_DEVICE_NAME);
    fields.name_is_complete = 1;
    fields.flags = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP;

    rc = ble_gap_adv_set_fields(&fields);
    if (rc != 0) {
        ESP_LOGE(TAG, "Erro ao configurar campos: %d", rc);
        return;
    }

    // Inicia o anúncio
    memset(&adv_params, 0, sizeof(adv_params));
    adv_params.conn_mode = BLE_GAP_CONN_MODE_NON; // Beacon não aceita conexões
    adv_params.disc_mode = BLE_GAP_DISC_MODE_GEN;

    rc = ble_gap_adv_start(addr_type, NULL, BLE_HS_FOREVER, &adv_params, NULL, NULL);
    if (rc != 0) {
        ESP_LOGE(TAG, "Erro ao iniciar anúncio: %d", rc);
    } else {
        ESP_LOGI(TAG, "Beacon anunciando como: %s", BEACON_DEVICE_NAME);
    }
}

// Task que roda o stack NimBLE
void ble_host_task(void *param) {
    nimble_port_run(); // Esta função só retorna quando o NimBLE para
    nimble_port_freertos_deinit();
}

void app_main(void) {
    // 1. Inicializa NVS (Obrigatório para Bluetooth)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Inicializa o stack NimBLE
    ESP_ERROR_CHECK(nimble_port_init());

    // 3. Configura callbacks importantes
    ble_hs_cfg.sync_cb = on_sync;

    // 4. Inicializa o serviço GAP (Generic Access Profile)
    ble_svc_gap_init();
    ESP_ERROR_CHECK(ble_svc_gap_device_name_set(BEACON_DEVICE_NAME));

    // 5. Cria a task do host NimBLE e inicia o loop
    nimble_port_freertos_init(ble_host_task);
}