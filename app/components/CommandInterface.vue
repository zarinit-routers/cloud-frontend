<script setup lang="ts">
import type { Response } from "@/models";
import { TOKEN } from "@/consts";
import { PRESETS } from "~/commandPresets";
const props = defineProps<{
    nodeId: string | string[];
}>();

const emit = defineEmits(["close"]);

// Состояние для командного интерфейса
const commandInput = ref("v1/timezone/get");
const requestBody = ref('{\n  "timezone": "Europe/Moscow"\n}');
const commandResponse = ref<Response | null>(null);
const isLoading = ref(false);
const commandError = ref("");

// Функция для выполнения команды
const executeCommand = async () => {
    isLoading.value = true;
    commandError.value = "";
    commandResponse.value = null;

    try {
        // Парсим тело запроса
        let parsedBody = {};
        if (requestBody.value.trim()) {
            try {
                parsedBody = JSON.parse(requestBody.value);
            } catch (e) {
                commandError.value = "Неверный JSON формат в теле запроса";
                isLoading.value = false;
                return;
            }
        }

        const { data: response } = await useFetch<Response>("/api/cmd/", {
            body: {
                nodeId: props.nodeId,
                command: commandInput.value,
                ...(Object.keys(parsedBody).length > 0 && { args: parsedBody }),
            },
            method: "POST",
            server: false,
            headers: {
                Authorization: TOKEN,
            },
        });

        if (response.value) {
            commandResponse.value = response.value;
        }
    } catch (error: any) {
        commandError.value = "Ошибка выполнения команды: " + error.message;
    } finally {
        isLoading.value = false;
    }
};

const selectPresetCommand = (command: string) => {
    commandInput.value = command;
    requestBody.value = PRESETS.find((preset) => preset.command === command)?.exampleBody || "";
};

const closeModal = () => {
    emit("close");
};

// Закрытие по клику вне модального окна
const modalRef = ref<HTMLElement>();
</script>

<template>
    <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div
            ref="modalRef"
            class="bg-[#2a2a30] rounded-xl shadow-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-transform duration-300 scale-95 animate-in fade-in-90 zoom-in-90">
            <!-- Заголовок -->
            <div class="flex justify-between items-center p-6 border-b border-gray-700 bg-gradient-to-r from-[#2a2a30] to-[#33333a]">
                <h2 class="text-xl font-semibold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Командный интерфейс
                </h2>
                <button @click="closeModal" class="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Контент с прокруткой -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
                <!-- Быстрый выбор команд -->
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3 text-gray-300">Быстрый выбор команды:</label>
                    <select
                        v-model="commandInput"
                        class="w-full p-3 bg-[#37343D] rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        @change="selectPresetCommand(commandInput)">
                        <option v-for="cmd in PRESETS" :key="cmd.command" :value="cmd.command" class="bg-[#37343D]">
                            {{ cmd.command }}
                        </option>
                    </select>
                </div>

                <!-- Ручной ввод команды -->
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3 text-gray-300">Команда:</label>
                    <input
                        v-model="commandInput"
                        placeholder="Введите команду (например: v1/timezone/get)"
                        class="w-full p-3 bg-[#37343D] rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" />
                </div>

                <!-- Тело запроса -->
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3 text-gray-300">Тело запроса (JSON):</label>
                    <textarea
                        v-model="requestBody"
                        placeholder='{"timezone": "Europe/Moscow"}'
                        class="w-full h-32 p-3 bg-[#37343D] rounded-lg border border-gray-600 text-white font-mono text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all duration-200 custom-scrollbar"
                        spellcheck="false" />
                </div>

                <!-- Кнопка выполнения -->
                <button
                    @click="executeCommand"
                    :disabled="isLoading"
                    class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                    <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {{ isLoading ? "Выполнение..." : "Выполнить команду" }}
                </button>

                <!-- Отображение ответа -->
                <div v-if="commandResponse || commandError" class="mt-8">
                    <h3 class="text-md font-semibold mb-4 text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ответ:
                    </h3>

                    <div v-if="commandError" class="p-4 bg-red-900/50 rounded-lg text-red-100 border border-red-700/50">
                        <div class="font-semibold flex items-center gap-2 mb-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ошибка:
                        </div>
                        {{ commandError }}
                    </div>

                    <div v-if="commandResponse" class="space-y-4">
                        <div v-if="commandResponse.data" class="p-4 bg-green-900/30 rounded-lg border border-green-700/50">
                            <div class="font-semibold text-green-300 flex items-center gap-2 mb-3">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Данные:
                            </div>
                            <pre class="text-sm mt-1 overflow-auto max-h-60 p-3 bg-black/20 rounded-lg custom-scrollbar">{{ JSON.stringify(commandResponse.data, null, 2) }}</pre>
                        </div>

                        <div v-if="commandResponse.commandError" class="p-4 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
                            <div class="font-semibold text-yellow-300 flex items-center gap-2 mb-3">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Ошибка команды:
                            </div>
                            <pre class="text-sm mt-1 whitespace-pre-wrap">{{ commandResponse.commandError }}</pre>
                        </div>

                        <div v-if="commandResponse.requestError" class="p-4 bg-red-900/30 rounded-lg border border-red-700/50">
                            <div class="font-semibold text-red-300 flex items-center gap-2 mb-3">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Ошибка запроса:
                            </div>
                            <pre class="text-sm mt-1 whitespace-pre-wrap">{{ commandResponse.requestError }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #2a2a30;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #2a2a30;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
}

.animate-in {
    animation-duration: 0.3s;
    animation-fill-mode: both;
}

.fade-in-90 {
    animation-name: fadeIn90;
}

.zoom-in-90 {
    animation-name: zoomIn90;
}

@keyframes fadeIn90 {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes zoomIn90 {
    from {
        transform: scale(0.95);
    }
    to {
        transform: scale(1);
    }
}
</style>
