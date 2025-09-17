<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";

const props = defineProps({
    node: {
        type: Object as () => Node,
        required: true,
    },
});

// Ключи для localStorage
const OS_CACHE_KEY = `device_os_${props.node.id}`;
const DEVICE_CACHE_KEY = `device_info_${props.node.id}`;
const CACHE_TIMESTAMP_KEY = `device_cache_timestamp_${props.node.id}`;

// Реактивные данные
const deviceInfo = ref<any>({});
const osInfo = ref<any>({});
const isLoading = ref(false);
const lastUpdated = ref<number | null>(null);
const hasError = ref(false);

// Оптимизированная функция выполнения команд с кэшированием
const executeDeviceCommand = async (command: string, args?: any): Promise<any> => {
    try {
        const { data: response } = await useFetch<Response>("/api/cmd/", {
            body: {
                nodeId: props.node.id,
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
    if (cacheTimestamp && now - parseInt(cacheTimestamp) < 5 * 60 * 1000) {
        loadFromCache();
        return;
    }

    isLoading.value = true;
    hasError.value = false;

    try {
        // Используем Promise.all для параллельного выполнения
        const [osData, deviceData] = await Promise.allSettled([executeDeviceCommand("v1/system/get-os-info"), executeDeviceCommand("v1/system/get-device-info")]);

        // Обрабатываем результаты
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

        if (updated) {
            lastUpdated.value = now;
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        }

        // Если оба запроса провалились
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

// Загружаем данные при монтировании
onMounted(() => {
    // Сначала загружаем из кэша для мгновенного отображения
    loadFromCache();

    // Затем пытаемся обновить данные с задержкой
    setTimeout(loadDeviceData, 1000);
});

// Функции для получения данных с мемоизацией
const getMacAddress = computed(() => {
    if (!osInfo.value?.NetworkStats?.length) return "";
    return osInfo?.value?.NetworkStats[0]?.MAC || "";
});

const getIpAddress = computed(() => {
    if (!osInfo.value?.NetworkStats?.length) return "";
    return osInfo?.value?.NetworkStats[0]?.IP || "";
});

const getDeviceName = computed(() => {
    if (deviceInfo.value.model) {
        return `${deviceInfo.value.manufacturer || ""} ${deviceInfo.value.model}`.trim();
    }
    return props.node.name || "Устройство";
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
    return Math.round(osInfo.value.Memory.Total / 1024 / 1024 / 1024) + " GB";
});

const getCpuInfo = computed(() => {
    if (!osInfo.value?.CpuStats) return null;
    return osInfo.value.CpuStats.CPUCount + " ядер";
});

const getLoadInfo = computed(() => {
    if (!osInfo.value?.LoadAverage) return null;
    return osInfo.value.LoadAverage.Loadavg1.toFixed(2);
});

const formatLastUpdated = () => {
    if (!lastUpdated.value) return "";
    return new Date(lastUpdated.value).toLocaleTimeString();
};

const forceRefresh = async (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    await loadDeviceData();
};
</script>

<template>
    <div class="node-card">
        <NuxtLink :to="`/nodes/${props.node.id}`" class="block">
            <div class="bg-[#222228] p-4 rounded-lg text-white cursor-pointer hover:bg-[#2a2930] transition-colors duration-200 border border-gray-700 relative">
                <!-- Индикатор ошибки -->
                <div v-if="hasError" class="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500" title="Ошибка подключения"></div>

                <!-- Заголовок -->
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-lg truncate max-w-[200px]">
                        {{ getDeviceName }}<span v-if="node.name" class="text-xs text-gray-400"> ({{ node.name }}) </span>

                        <span v-if="isLoading" class="ml-2 text-yellow-400 text-sm">⟳</span>
                    </h3>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" :class="node.connected ? 'bg-green-500' : 'bg-red-500'" :title="hasError ? 'Ошибка подключения' : 'Онлайн'"></div>
                        <span v-if="!node.connected" class="text-xs text-gray-400" :title="`Обновлено: ${formatLastUpdated()}`">
                            {{ new Date(node.lastConnection).toLocaleString() }}
                        </span>
                        <button v-if="hasError" @click="forceRefresh" class="text-xs text-blue-400 hover:text-blue-300 ml-2">Повторить</button>
                    </div>
                </div>

                <!-- Сообщение об ошибке -->
                <div v-if="hasError" class="mb-3 p-2 bg-red-500/20 rounded text-xs text-red-300">Ошибка загрузки данных. Используются кэшированные данные.</div>

                <!-- Информация о системе -->
                <div class="space-y-2 text-sm text-gray-300">
                    <!-- ID ноды -->
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">ID:</span>
                        <span class="font-mono text-xs text-gray-300">{{ props.node.id || "-" }}</span>
                    </div>

                    <!-- IP адрес -->
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">IP:</span>
                        <span class="font-mono text-xs text-gray-300">
                            {{ getIpAddress || "не указан" }}
                        </span>
                    </div>

                    <!-- MAC адрес -->
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">MAC:</span>
                        <span class="font-mono text-xs text-gray-300">
                            {{ getMacAddress || "не указан" }}
                        </span>
                    </div>

                    <!-- CPU -->
                    <div class="flex justify-between">
                        <span class="text-gray-400">CPU:</span>
                        <span class="text-gray-300">
                            {{ getCpuInfo || "не указан" }}
                        </span>
                    </div>

                    <!-- Память -->
                    <div class="flex justify-between">
                        <span class="text-gray-400">Память:</span>
                        <span class="text-gray-300">
                            {{ getMemoryInfo || "не указана" }}
                        </span>
                    </div>

                    <!-- Нагрузка -->
                    <div class="flex justify-between">
                        <span class="text-gray-400">Нагрузка:</span>
                        <span class="text-gray-300">
                            {{ getLoadInfo || "не указана" }}
                        </span>
                    </div>

                    <!-- Диск -->
                    <div v-if="getDiskInfo" class="pt-1">
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-gray-400">Диск:</span>
                            <span class="text-gray-300">{{ getDiskInfo.used }} / {{ getDiskInfo.total }}</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                                class="h-1.5 rounded-full transition-all duration-300"
                                :class="{
                                    'bg-green-500': getDiskInfo.usagePercent < 70,
                                    'bg-yellow-500': getDiskInfo.usagePercent >= 70 && getDiskInfo.usagePercent < 90,
                                    'bg-red-500': getDiskInfo.usagePercent >= 90,
                                }"
                                :style="{ width: getDiskInfo.usagePercent + '%' }"></div>
                        </div>
                    </div>

                    <!-- Теги -->
                    <div v-if="props.node.tags && props.node.tags.length" class="pt-2 mt-2 border-t border-gray-600">
                        <div class="flex flex-wrap gap-1">
                            <span v-for="tag in props.node.tags" :key="tag" class="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300">
                                {{ tag.tag }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<style scoped>
.node-card {
    transition: transform 0.2s ease;
}

.node-card:hover {
    transform: translateY(-1px);
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
