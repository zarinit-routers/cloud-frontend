<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";
import { useRoute } from "vue-router";


const route = useRoute();
const id = computed(() => route.params.id);
const strId = computed(() => {
    if (typeof id.value === "string") {
        return id.value;
    }
    return "0";
});

// Ключи для localStorage
const OS_CACHE_KEY = `device_os_${strId.value}`;
const DEVICE_CACHE_KEY = `device_info_${strId.value}`;
const CACHE_TIMESTAMP_KEY = `device_cache_timestamp_${strId.value}`;

// Реактивные данные
const {
    data,
    error,
    status,
    refresh: refreshClient,
} = await useFetch<{ node: Node }>(() => "/api/clients/" + id.value, {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
    onRequestError: (error) => {
        console.error(error);
    },
});

const deviceInfo = ref<any>({});
const osInfo = ref<any>({});
const isLoading = ref(false);
const lastUpdated = ref<number | null>(null);
const hasError = ref(false);
const showCommandModal = ref(false);

// Новые состояния для SSH, модемов и логов
const sshStatus = ref<boolean>(false);
const modemsList = ref<any[]>([]);
const simCards = ref<any[]>([]);
const selectedJournal = ref<string>("system");
const journalContent = ref<string>("");
const showLogsModal = ref(false);
const isRebooting = ref(false);

const executeDeviceCommand = async (command: string, args?: any): Promise<any> => {
    try {
        const { data: response } = await useFetch<Response>("/api/cmd/", {
            body: {
                nodeId: id.value,
                command: command,
                ...(args && { args: args }),
            },
            method: "POST",
            server: false,
            headers: {
                Authorization: TOKEN,
            },
        });

        return response.value?.data;
    } catch (error) {
        console.error(`Ошибка выполнения команды ${command}:`, error);
        throw error;
    }
};

// Функции для управления SSH
const getSshStatus = async () => {
    try {
        const status = await executeDeviceCommand("v1/ssh/get-status");
        sshStatus.value = status.enabled;
        return status;
    } catch (error) {
        console.error("Ошибка получения статуса SSH:", error);
        throw error;
    }
};


const toggleSsh = async () => {
    try {
        const command = sshStatus.value ? "v1/ssh/disable" : "v1/ssh/enable";
        const result = await executeDeviceCommand(command);
        sshStatus.value = result.enabled;
        return result;
    } catch (error) {
        console.error("Ошибка переключения SSH:", error);
        throw error;
    }
};

// Функция перезагрузки системы
const rebootSystem = async () => {
    if (!confirm("Вы уверены, что хотите перезагрузить систему?")) {
        return;
    }

    isRebooting.value = true;
    try {
        await executeDeviceCommand("v1/system/reboot");
        setTimeout(() => {
            isRebooting.value = false;
            alert("Система перезагружается...");
        }, 2000);
    } catch (error) {
        console.error("Ошибка перезагрузки:", error);
        isRebooting.value = false;
        alert("Команда перезагрузки отправлена (может возвращать ошибку из-за специфики выполнения)");
    }
};

// Функции для работы с модемами и SIM-картами
const loadModems = async () => {
  try {
    console.log("Запрос списка модемов...");
    const response = await executeDeviceCommand("v1/modems/list");
    console.log("Ответ от API модемов:", response);
    
    // Обрабатываем разные форматы ответа
    let modemsData = [];
    
    if (Array.isArray(response)) {
      modemsData = response;
    } else if (response && typeof response === 'object') {
      // Проверяем различные возможные структуры
      modemsData = response.modems || 
                  response.data || 
                  response.list || 
                  response.results || 
                  Object.values(response).find(Array.isArray) || 
                  [];
    }
    
    // Преобразуем данные для удобства использования
    modemsList.value = modemsData.map((modem: any) => {
      // Безопасное получение dbusPath (обрабатываем разные варианты написания)
      const dbusPath = modem.dbusPath || modem.dbus_path || modem['dbus-path'] || '';
      const modemId = dbusPath ? dbusPath.split('/').pop() : modem.id || 'unknown';
      
      return {
        ...modem,
        id: modemId,
        // Нормализуем структуру
        generic: modem.generic || modem.status || modem,
        '3gpp': modem['3gpp'] || modem.threegpp || modem.cellular || {}
      };
    });
    
    console.log("Обработанные модемы:", modemsList.value);
    return modemsList.value;
  } catch (error) {
    console.error("Ошибка загрузки модемов:", error);
    modemsList.value = [];
    throw error;
  }
};

const toggleModem = async (modemId: string, enable: boolean) => {
    try {
        const command = enable ? "v1/modems/enable" : "v1/modems/disable";
        await executeDeviceCommand(command, { modem: modemId });
        
        // Локально обновляем статус модема для мгновенного отклика UI
        const modemIndex = modemsList.value.findIndex((m) => m.id === modemId);
        if (modemIndex !== -1) {
            modemsList.value[modemIndex].enabled = enable;
        }
        
        // Затем обновляем весь список
        await loadModems();
    } catch (error) {
        console.error("Ошибка переключения модема:", error);
        throw error;
    }
};

const getModemSignal = async (modemId: string) => {
    try {
        const signal = await executeDeviceCommand("v1/modems/get-signal", { modem: modemId });
        // Обновляем данные модема
        const modemIndex = modemsList.value.findIndex((m) => m.id === modemId);
        if (modemIndex !== -1) {
            modemsList.value[modemIndex].signal = signal.signal;
        }
        return signal;
    } catch (error) {
        console.error("Ошибка получения сигнала модема:", error);
        throw error;
    }
};

// Обработчики с обработкой ошибок
const handleToggleModem = async (modemId: string, enabled: boolean) => {
  try {
    await toggleModem(modemId, enabled);
  } catch (error) {
    console.error('Ошибка переключения модема:', error);
  }
};

const handleGetSignal = async (modemId: string) => {
  try {
    await getModemSignal(modemId);
  } catch (error) {
    console.error('Ошибка получения сигнала:', error);
  }
};

// Функции для работы с журналами
const loadJournal = async (journal: string) => {
    try {
        const result = await executeDeviceCommand("v1/journals/get", { journal });
        journalContent.value = result.journal || result.content || "";
        return result;
    } catch (error) {
        console.error("Ошибка загрузки журнала:", error);
        throw error;
    }
};

const showJournalModal = async (journal: string = "system") => {
    selectedJournal.value = journal;
    showLogsModal.value = true;
    await loadJournal(journal);
};

// Загрузка данных с улучшенным кэшированием
const loadDeviceData = async () => {
    const now = Date.now();
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cacheTimestamp && now - parseInt(cacheTimestamp) < 5 * 60 * 1000) {
        loadFromCache();
        return;
    }

    isLoading.value = true;
    hasError.value = false;

    try {
        const [osData, deviceData, sshData, modemsData] = await Promise.allSettled([
            executeDeviceCommand("v1/system/get-os-info"),
            executeDeviceCommand("v1/system/get-device-info"),
            getSshStatus(),
            loadModems(),
        ]);

        let updated = false;

        if (osData.status === "fulfilled" && osData.value) {
            osInfo.value = osData.value;
            localStorage.setItem(OS_CACHE_KEY, JSON.stringify(osData.value));
            updated = true;
        }

        if (deviceData.status === "fulfilled" && deviceData.value) {
            deviceInfo.value = deviceData.value;
            localStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(deviceData.value));
            updated = true;
        }

        if (sshData.status === "fulfilled" && sshData.value) {
            sshStatus.value = sshData.value.enabled;
        }

        if (modemsData.status === "fulfilled" && modemsData.value) {
            modemsList.value = modemsData.value;
        }

        if (updated) {
            lastUpdated.value = now;
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        }

        if (osData.status === "rejected" && deviceData.status === "rejected") {
            throw new Error("Не удалось получить данные устройства");
        }
    } catch (error) {
        console.error("Ошибка загрузки данных устройства:", error);
        hasError.value = true;
        loadFromCache();
    } finally {
        isLoading.value = false;
    }
};

// Загрузка данных из кэша
const loadFromCache = () => {
    try {
        const cachedOs = localStorage.getItem(OS_CACHE_KEY);
        const cachedDevice = localStorage.getItem(DEVICE_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cachedOs) {
            osInfo.value = JSON.parse(cachedOs);
        }

        if (cachedDevice) {
            deviceInfo.value = JSON.parse(cachedDevice);
        }

        if (cachedTimestamp) {
            lastUpdated.value = parseInt(cachedTimestamp);
        }
    } catch (error) {
        console.warn("Ошибка загрузки из кэша:", error);
    }
};

// Computed свойства
const getMacAddress = computed(() => {
    if (!osInfo.value?.NetworkStats?.length) return "";
    return osInfo?.value?.NetworkStats[0]?.MAC || "";
});

const getIpAddress = computed(() => {
    if (!osInfo.value?.NetworkStats?.length) return "";
    return osInfo?.value?.NetworkStats[0]?.IP || "";
});

const getDiskInfo = computed(() => {
    if (!osInfo.value?.DiskStats?.length) return null;

    const rootDisk = osInfo.value.DiskStats.find((disk) => disk.mountPoint === "/");
    if (!rootDisk) return null;

    const total = parseInt(rootDisk.size) || 0;
    const used = parseInt(rootDisk.used) || 0;
    const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
        used: Math.round(used / 1024 / 1024) + " GB",
        total: Math.round(total / 1024 / 1024) + " GB",
        usagePercent: usagePercent,
    };
});

const getMemoryInfo = computed(() => {
    if (!osInfo.value?.Memory) return null;
    const total = Math.round(osInfo.value.Memory.Total / 1024 / 1024 / 1024);
    const used = Math.round((osInfo.value.Memory.Total - osInfo.value.Memory.Free) / 1024 / 1024 / 1024);
    const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
        total: total + " GB",
        used: used + " GB",
        usagePercent: usagePercent,
    };
});

const getCpuInfo = computed(() => {
    if (!osInfo.value?.CpuStats) return null;
    return osInfo.value.CpuStats.CPUCount + " ядер";
});

const getLoadInfo = computed(() => {
    if (!osInfo.value?.LoadAverage) return null;
    return osInfo.value.LoadAverage.Loadavg1.toFixed(2);
});

const forceRefresh = async () => {
    await loadDeviceData();
};

// Таймер для автоматического обновления
let refreshTimer: NodeJS.Timeout;

onMounted(async () => {
    loadFromCache();
    setTimeout(loadDeviceData, 1000);
    refreshTimer = setInterval(loadDeviceData, 5 * 60 * 1000);
});

onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});

defineEmits<{
  toggleModem: [id: string, enabled: boolean]
  getSignal: [id: string]
  refreshModems: []
  updateModems: [] // Добавляем это
}>()

// Добавьте обработчик:

const handleUpdateModems = async () => {
  try {
    await loadModems(); // Эта функция уже определена в вашем компоненте
    // Можно добавить уведомление об успешном обновлении
    console.log('Данные модемов успешно обновлены');
  } catch (error) {
    console.error('Ошибка обновления модемов:', error);
  }
};



</script>

<template>
    <div class="min-h-screen bg-[#1a1a1f] text-white p-4">
        <DeviceHeader :nodeName="data?.node.name" :deviceInfo="deviceInfo" :hasError="hasError" :isLoading="isLoading" :lastUpdated="lastUpdated" @refresh="forceRefresh" :node="data?.node ?? {}" />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Левая колонка - Информация об устройстве -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Карточка с общей информацией -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Общая информация</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <InfoItem label="ID устройства" :value="data?.node.id" />
                            <InfoItem label="Производитель" :value="deviceInfo.manufacturer" />
                            <InfoItem label="Модель" :value="deviceInfo.model" />
                            <InfoItem label="Версия прошивки" :value="deviceInfo.firmwareVersion" />
                        </div>
                        <div class="space-y-3">
                            <InfoItem label="IP адрес" :value="getIpAddress" />
                            <InfoItem label="MAC адрес" :value="getMacAddress" />
                            <InfoItem label="Процессор" :value="getCpuInfo" />
                            <InfoItem label="Нагрузка системы" :value="getLoadInfo ? getLoadInfo + '%' : ''" />
                        </div>
                    </div>
                </div>

                <SystemResources :memoryInfo="getMemoryInfo" :diskInfo="getDiskInfo" />

                <!-- Управление SSH -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Управление SSH</h2>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-300">SSH доступ</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" :checked="sshStatus" @change="toggleSsh" />
                            <div
                                class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <p class="text-sm text-gray-400 mt-2">Текущий статус: {{ sshStatus ? "Включен" : "Выключен" }}</p>
                </div>

                <!-- Кнопки управления системой -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Управление системой</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button @click="rebootSystem" class="px-4 py-3 bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2" :disabled="isRebooting">
                            <span v-if="isRebooting" class="animate-spin">⟳</span>
                            <span v-else>🔄</span>
                            {{ isRebooting ? "Перезагрузка..." : "Перезагрузить систему" }}
                        </button>

                        <button @click="showJournalModal('system')" class="px-4 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                            📋 Системные логи
                        </button>
                    </div>
                </div>

                <!-- Таймзона -->
                <TimezoneControl :nodeId="id" />

                <!-- Теги -->
                <TagEdit :id="strId" :tags="data?.node.tags" v-if="data" />

                <!-- Командный интерфейс -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Управление устройством</h2>
                    <button @click="showCommandModal = true" class="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <span>📟</span>
                        Открыть командный интерфейс
                    </button>
                </div>
            </div>

            <!-- Правая колонка - Сим карты и модемы -->
            <div class="space-y-6">
                <ModemsSection 
                    :modemsList="modemsList" 
                    @toggleModem="handleToggleModem" 
                    @getSignal="handleGetSignal" 
                    @refreshModems="loadModems"
                    @updateModems="handleUpdateModems"
                />

                

                <!-- Дополнительная информация -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Дополнительно</h2>
                    <div class="space-y-3">
                        <InfoItem label="Статус" :value="hasError ? 'Ошибка подключения' : 'Активно'" />
                        <InfoItem label="Последнее обновление" :value="lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''" />
                        <InfoItem label="Версия ОС" :value="osInfo?.OsRelease?.PRETTY_NAME" />
                        <InfoItem label="SSH статус" :value="sshStatus ? 'Включен' : 'Выключен'" />
                    </div>
                </div>

                <!-- Быстрый доступ к журналам -->
                <div class="bg-[#222228] rounded-xl p-6">
                    <h2 class="text-lg font-semibold mb-4">Журналы системы</h2>
                    <div class="grid grid-cols-2 gap-2">
                        <button @click="showJournalModal('system')" class="px-3 py-2 bg-gray-600 rounded text-sm hover:bg-gray-700 transition-colors">Система</button>
                        <button @click="showJournalModal('core')" class="px-3 py-2 bg-gray-600 rounded text-sm hover:bg-gray-700 transition-colors">Ядро</button>
                        <button @click="showJournalModal('connections')" class="px-3 py-2 bg-gray-600 rounded text-sm hover:bg-gray-700 transition-colors">Подключения</button>
                        <button @click="showJournalModal('port-forwarding')" class="px-3 py-2 bg-gray-600 rounded text-sm hover:bg-gray-700 transition-colors">Порт-форвардинг</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальное окно с командным интерфейсом -->
        <CommandInterface v-if="showCommandModal" :nodeId="id" @close="showCommandModal = false" />

        <!-- Модальное окно с логами -->
        <div v-if="showLogsModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-[#222228] rounded-xl p-6 w-11/12 max-w-4xl max-h-[80vh] overflow-hidden">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Журнал: {{ selectedJournal }}</h2>
                    <button @click="showLogsModal = false" class="text-gray-400 hover:text-white">✕</button>
                </div>

                <div class="mb-4 flex gap-2">
                    <select v-model="selectedJournal" @change="loadJournal(selectedJournal)" class="bg-[#37343D] border border-[#555461] rounded-lg px-3 py-2 text-white">
                        <option value="system">Система</option>
                        <option value="core">Ядро</option>
                        <option value="connections">Подключения</option>
                        <option value="port-forwarding">Порт-форвардинг</option>
                    </select>

                    <button @click="loadJournal(selectedJournal)" class="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Обновить</button>
                </div>

                <div class="bg-[#1a1a1f] rounded-lg p-4 overflow-auto max-h-[60vh]">
                    <pre class="text-sm whitespace-pre-wrap">{{ journalContent }}</pre>
                </div>

                <div class="mt-4 flex justify-end">
                    <button @click="showLogsModal = false" class="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors">Закрыть</button>
                </div>
            </div>
        </div>

        <!-- Сообщение об ошибке -->
        <div v-if="hasError" class="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg">
            <div class="flex items-center gap-2">
                <span>⚠️</span>
                <span>Ошибка загрузки данных. Используются кэшированные данные.</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>