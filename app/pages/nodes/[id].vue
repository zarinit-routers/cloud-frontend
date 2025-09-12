<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";


const route = useRoute();
const id = computed(() => route.params.id);
const { data, error, status, refresh: refreshClient } = await useFetch<{ node: Node }>(() => "/api/clients/" + id.value, {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
    onRequestError: (error) => {
        console.error(error);
    },
});



//Timezone 
const formTimezone = ref<string>();
const { data: commandData } = await useFetch<Response>("/api/cmd/v1/timezone/get", {
    body: {
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
        console.log(response._data);
    },
});

const onTimezoneSet = async () => {
    await useFetch<Response>("/api/cmd/v1/timezone/set", {
        body: {
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
            console.log(response._data);
            commandData.value = response._data;
        },
    });
};


// Состояние для командного интерфейса
const commandInput = ref('v1/timezone/get');
const requestBody = ref('{\n  "timezone": "Europe/Moscow"\n}');
const commandResponse = ref<Response | null>(null);
const isLoading = ref(false);
const commandError = ref('');


// Функция для выполнения команды
const executeCommand = async () => {
    isLoading.value = true;
    commandError.value = '';
    commandResponse.value = null;

    try {
        // Парсим тело запроса
        let parsedBody = {};
        if (requestBody.value.trim()) {
            try {
                parsedBody = JSON.parse(requestBody.value);
            } catch (e) {
                commandError.value = 'Неверный JSON формат в теле запроса';
                isLoading.value = false;
                return;
            }
        }

        // Определяем метод на основе команды
        const method = commandInput.value.includes('/set') || 
                      commandInput.value.includes('/enable') || 
                      commandInput.value.includes('/disable') ? 'POST' : 'GET';

        const { data: response } = await useFetch<Response>(`/api/cmd/${commandInput.value}`, {
            body: {
                nodeId: id.value,
                ...(Object.keys(parsedBody).length > 0 && { args: parsedBody })
            },
            method: "POST",
            server: false,
            headers: {
                Authorization: TOKEN,
            },
        });

        commandResponse.value = response.value;
    } catch (error) {
        commandError.value = 'Ошибка выполнения команды: ' + error.message;
    } finally {
        isLoading.value = false;
    }
};

// Предустановленные команды для быстрого выбора
const presetCommands = [
    'v1/timezone/get',
    'v1/timezone/set',
    'v1/system/get-os-info',
    'v1/system/get-device-info',
    'v1/ssh/get-status',
    'v1/ssh/enable',
    'v1/ssh/disable',
    'v1/system/reboot'
];

const selectPresetCommand = (command: string) => {
    commandInput.value = command;
    
    // Устанавливаем соответствующий body для некоторых команд
    switch (command) {
        case 'v1/timezone/set':
            requestBody.value = '{\n  "timezone": "Europe/Moscow"\n}';
            break;
        case 'v1/ssh/enable':
        case 'v1/ssh/disable':
            requestBody.value = '';
            break;
        default:
            requestBody.value = '';
    }
};

onMounted(async () => {});



const strId = computed(() => {
    if (typeof id.value === "string") {
        return id.value;
    }
    

    return "0";
});







</script>
<template>
    <div>
        <h1 class="m-3">{{ data?.node.name }}</h1>
        <div class="m-3">{{ data?.node.id }}</div>


        <tag-edit :id="strId" :tags="data?.node.tags" v-if="data"/> 



         <!-- Командный интерфейс -->
        <div class="m-3 p-4 bg-[#222228] rounded-xl">
            <h2 class="text-lg font-semibold mb-4">Командный интерфейс</h2>
            
            <!-- Быстрый выбор команд -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Быстрый выбор команды:</label>
                <select 
                    v-model="commandInput" 
                    class="w-full p-2 bg-[#37343D] rounded border border-gray-600"
                    @change="selectPresetCommand(commandInput)"
                >
                    <option 
                        v-for="cmd in presetCommands" 
                        :key="cmd" 
                        :value="cmd"
                        class="bg-[#37343D]"
                    >
                        {{ cmd }}
                    </option>
                </select>
            </div>

            <!-- Ручной ввод команды -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Команда:</label>
                <input 
                    v-model="commandInput" 
                    placeholder="Введите команду (например: v1/timezone/get)"
                    class="w-full p-2 bg-[#37343D] rounded border border-gray-600"
                />
            </div>

            <!-- Тело запроса -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Тело запроса (JSON):</label>
                <textarea 
                    v-model="requestBody" 
                    placeholder='{"timezone": "Europe/Moscow"}'
                    class="w-full h-32 p-2 bg-[#37343D] rounded border border-gray-600 font-mono text-sm"
                    spellcheck="false"
                />
            </div>

            <!-- Кнопка выполнения -->
            <button 
                @click="executeCommand" 
                :disabled="isLoading"
                class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {{ isLoading ? 'Выполнение...' : 'Выполнить команду' }}
            </button>

            <!-- Отображение ответа -->
            <div v-if="commandResponse || commandError" class="mt-6">
                <h3 class="text-md font-semibold mb-2">Ответ:</h3>
                
                <div v-if="commandError" class="p-3 bg-red-900 rounded text-red-100">
                    {{ commandError }}
                </div>

                <div v-if="commandResponse" class="space-y-3">
                    <div v-if="commandResponse.data" class="p-3 bg-green-900 rounded">
                        <div class="font-semibold">Данные:</div>
                        <pre class="text-sm mt-1 overflow-auto">{{ JSON.stringify(commandResponse.data, null, 2) }}</pre>
                    </div>
                    
                    <div v-if="commandResponse.commandError" class="p-3 bg-yellow-900 rounded">
                        <div class="font-semibold">Ошибка команды:</div>
                        <pre class="text-sm mt-1">{{ commandResponse.commandError }}</pre>
                    </div>
                    
                    <div v-if="commandResponse.requestError" class="p-3 bg-red-900 rounded">
                        <div class="font-semibold">Ошибка запроса:</div>
                        <pre class="text-sm mt-1">{{ commandResponse.requestError }}</pre>
                    </div>
                </div>
            </div>
        </div>




        <!-- <CommandSender :nodeId="id" /> Блок Тайм зоны -->
        <div v-if="commandData">
            <div class="bg-[#222228] p-3 rounded-xl m-3" v-if="commandData.data?.timezone">
                Timezone: <span>{{ commandData.data.timezone }}</span>
            </div>
            <div v-if="commandData.requestError">{{ commandData.requestError }}</div>
            <div v-if="commandData.commandError">{{ commandData.commandError }}</div>
            <div class="p-1 bg-[#37343D] m-3" v-if="commandData.data">
                <form @submit.prevent="onTimezoneSet">
                    <select v-model="formTimezone">
                        <option class="bg-[#37343D]" v-for="timezone in Intl.supportedValuesOf('timeZone')" :selected="timezone == commandData.data.timezone" :key="timezone">{{ timezone }}</option>
                    </select>
                    <input type="submit" value="Применить" v-show="commandData.data.timezone != formTimezone" />
                </form>
            </div>
        </div>
        <div>

        </div>
        
    </div>
</template>
