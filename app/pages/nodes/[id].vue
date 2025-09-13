<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";
import CommandInterface from "@/components/CommandInterface.vue";

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
const { data, error, status, refresh: refreshClient } = await useFetch<{ node: Node }>(
  () => "/api/clients/" + id.value,
  {
    server: false,
    headers: {
      Authorization: TOKEN,
    },
    onRequestError: (error) => {
      console.error(error);
    },
  }
);

const deviceInfo = ref<any>({});
const osInfo = ref<any>({});
const isLoading = ref(false);
const lastUpdated = ref<number | null>(null);
const hasError = ref(false);
const showCommandModal = ref(false);

// Timezone
const formTimezone = ref<string>();
const { data: commandData } = await useFetch<Response>("/api/cmd/", {
  body: {
    command: "v1/timezone/get",
    nodeId: id.value,
  },
  method: "POST",
  server: false,
  headers: {
    Authorization: TOKEN,
  },
  onResponse: ({ response }) => {
    if (!response.ok) {
      console.error("Response is not ok");
      return;
    }
    formTimezone.value = response._data.data.timezone;
  },
});

const onTimezoneSet = async () => {
  await useFetch<Response>("/api/cmd/", {
    body: {
      command: "v1/timezone/set",
      nodeId: id.value,
      args: {
        timezone: formTimezone.value,
      },
    },
    method: "POST",
    server: false,
    headers: {
      Authorization: TOKEN,
    },
    onResponse: ({ response }) => {
      if (!response.ok) {
        console.error("Response is not ok");
      }
      commandData.value = response._data;
    },
  });
};

// Оптимизированная функция выполнения команд с кэшированием
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

// Загрузка данных с улучшенным кэшированием
const loadDeviceData = async () => {
  const now = Date.now();
  const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  
  // Проверяем, нужно ли обновлять данные (прошло больше 5 минут)
  if (cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
    loadFromCache();
    return;
  }

  isLoading.value = true;
  hasError.value = false;

  try {
    // Используем Promise.all для параллельного выполнения
    const [osData, deviceData] = await Promise.allSettled([
      executeDeviceCommand('v1/system/get-os-info'),
      executeDeviceCommand('v1/system/get-device-info')
    ]);

    // Обрабатываем результаты
    let updated = false;
    
    if (osData.status === 'fulfilled' && osData.value) {
      osInfo.value = osData.value;
      localStorage.setItem(OS_CACHE_KEY, JSON.stringify(osData.value));
      updated = true;
    }

    if (deviceData.status === 'fulfilled' && deviceData.value) {
      deviceInfo.value = deviceData.value;
      localStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(deviceData.value));
      updated = true;
    }

    if (updated) {
      lastUpdated.value = now;
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
    }

    // Если оба запроса провалились
    if (osData.status === 'rejected' && deviceData.status === 'rejected') {
      throw new Error('Не удалось получить данные устройства');
    }

  } catch (error) {
    console.error('Ошибка загрузки данных устройства:', error);
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
    console.warn('Ошибка загрузки из кэша:', error);
  }
};

// Функции для получения данных
const getMacAddress = computed(() => {
  if (!osInfo.value?.NetworkStats?.length) return '';
  return osInfo?.value?.NetworkStats[0]?.MAC || '';
});

const getIpAddress = computed(() => {
  if (!osInfo.value?.NetworkStats?.length) return '';
  return osInfo?.value?.NetworkStats[0]?.IP || '';
});

const getDiskInfo = computed(() => {
  if (!osInfo.value?.DiskStats?.length) return null;
  
  const rootDisk = osInfo.value.DiskStats.find(disk => disk.mountPoint === '/');
  if (!rootDisk) return null;
  
  const total = parseInt(rootDisk.size) || 0;
  const used = parseInt(rootDisk.used) || 0;
  const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;
  
  return {
    used: Math.round(used / 1024 / 1024) + ' GB',
    total: Math.round(total / 1024 / 1024) + ' GB',
    usagePercent: usagePercent
  };
});

const getMemoryInfo = computed(() => {
  if (!osInfo.value?.Memory) return null;
  const total = Math.round(osInfo.value.Memory.Total / 1024 / 1024 / 1024);
  const used = Math.round((osInfo.value.Memory.Total - osInfo.value.Memory.Free) / 1024 / 1024 / 1024);
  const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;
  
  return {
    total: total + ' GB',
    used: used + ' GB',
    usagePercent: usagePercent
  };
});

const getCpuInfo = computed(() => {
  if (!osInfo.value?.CpuStats) return null;
  return osInfo.value.CpuStats.CPUCount + ' ядер';
});

const getLoadInfo = computed(() => {
  if (!osInfo.value?.LoadAverage) return null;
  return osInfo.value.LoadAverage.Loadavg1.toFixed(2);
});

const formatLastUpdated = () => {
  if (!lastUpdated.value) return '';
  return new Date(lastUpdated.value).toLocaleTimeString();
};

const forceRefresh = async () => {
  await loadDeviceData();
};

// Таймер для автоматического обновления
let refreshTimer: NodeJS.Timeout;

onMounted(async () => {
  // Сначала загружаем из кэша для мгновенного отображения
  loadFromCache();
  
  // Затем пытаемся обновить данные
  setTimeout(loadDeviceData, 1000);
  
  // Устанавливаем таймер для обновления каждые 5 минут
  refreshTimer = setInterval(loadDeviceData, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#1a1a1f] text-white p-4">
    <!-- Шапка с информацией об устройстве -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ data?.node.name || 'Устройство' }}</h1>
        <p class="text-gray-400 text-sm">{{ deviceInfo.manufacturer }} {{ deviceInfo.model }} {{ deviceInfo.firmwareVersion }}</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Индикатор статуса -->
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" :class="hasError ? 'bg-red-500' : 'bg-green-500'"></div>
          <span class="text-sm text-gray-400">{{ hasError ? 'Ошибка' : 'Онлайн' }}</span>
        </div>
        
        <!-- Кнопка обновления -->
        <button 
          @click="forceRefresh" 
          class="p-2 bg-[#37343D] rounded-lg hover:bg-[#45434d] transition-colors"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="animate-spin">⟳</span>
          <span v-else>🔄</span>
        </button>
        
        <!-- Время последнего обновления -->
        <span v-if="lastUpdated" class="text-sm text-gray-400">
          Обновлено: {{ formatLastUpdated() }}
        </span>
      </div>
    </div>

    <!-- Основной контент -->
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

        <!-- Карточка с ресурсами -->
        <div class="bg-[#222228] rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Ресурсы системы</h2>
          <div class="space-y-4">
            <!-- Память -->
            <div v-if="getMemoryInfo">
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-400">Память</span>
                <span class="text-sm text-gray-300">{{ getMemoryInfo.used }} / {{ getMemoryInfo.total }}</span>
              </div>
              <div class="w-full bg-[#37343D] rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': getMemoryInfo.usagePercent < 70,
                    'bg-yellow-500': getMemoryInfo.usagePercent >= 70 && getMemoryInfo.usagePercent < 90,
                    'bg-red-500': getMemoryInfo.usagePercent >= 90
                  }"
                  :style="{ width: getMemoryInfo.usagePercent + '%' }"
                ></div>
              </div>
            </div>

            <!-- Диск -->
            <div v-if="getDiskInfo">
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-400">Дисковое пространство</span>
                <span class="text-sm text-gray-300">{{ getDiskInfo.used }} / {{ getDiskInfo.total }}</span>
              </div>
              <div class="w-full bg-[#37343D] rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': getDiskInfo.usagePercent < 70,
                    'bg-yellow-500': getDiskInfo.usagePercent >= 70 && getDiskInfo.usagePercent < 90,
                    'bg-red-500': getDiskInfo.usagePercent >= 90
                  }"
                  :style="{ width: getDiskInfo.usagePercent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Таймзона -->
        <div v-if="commandData" class="bg-[#222228] rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Настройки времени</h2>
          <div class="space-y-4">
            <InfoItem label="Текущая таймзона" :value="commandData.data?.timezone" />
            
            <div class="p-4 bg-[#37343D] rounded-lg">
              <form @submit.prevent="onTimezoneSet" class="space-y-3">
                <label class="block text-sm font-medium text-gray-300">Изменить таймзону</label>
                <select 
                  v-model="formTimezone" 
                  class="w-full bg-[#45434d] border border-[#555461] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option v-for="timezone in Intl.supportedValuesOf('timeZone')" 
                          :value="timezone" 
                          :key="timezone"
                          :selected="timezone === commandData.data?.timezone">
                    {{ timezone }}
                  </option>
                </select>
                
                <button 
                  type="submit" 
                  v-show="commandData.data?.timezone !== formTimezone"
                  class="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  :disabled="commandData.data?.timezone === formTimezone"
                >
                  Применить
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Теги -->
        <TagEdit :id="strId" :tags="data?.node.tags" v-if="data" />

        <!-- Командный интерфейс -->
        <div class="bg-[#222228] rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Управление устройством</h2>
          <button 
            @click="showCommandModal = true"
            class="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>📟</span>
            Открыть командный интерфейс
          </button>
        </div>
      </div>

      <!-- Правая колонка - Сим карты (заглушка) -->
      <div class="space-y-6">
        <!-- Блок SIM карт -->
        <div class="bg-[#222228] rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">SIM карты</h2>
          <div class="text-center py-8 text-gray-400">
            <div class="text-4xl mb-2">📱</div>
            <p>Информация о SIM картах</p>
            <p class="text-sm">Функциональность в разработке</p>
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div class="bg-[#222228] rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Дополнительно</h2>
          <div class="space-y-3">
            <InfoItem label="Статус" :value="hasError ? 'Ошибка подключения' : 'Активно'" />
            <InfoItem label="Последнее обновление" :value="formatLastUpdated()" />
            <InfoItem label="Версия ОС" :value="osInfo?.OsRelease?.PRETTY_NAME" />
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно с командным интерфейсом -->
    <CommandInterface 
      v-if="showCommandModal" 
      :nodeId="id" 
      @close="showCommandModal = false" 
    />

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