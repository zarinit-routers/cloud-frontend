<script setup lang="ts">
import { TOKEN } from "~/consts";
import { useAxios } from "@vueuse/integrations/useAxios";
const props = defineProps<{ nodeId: string }>();
// Timezone
const formTimezone = ref<string>();
const {
    data: commandData,
    error,
    execute: fetchTimezone,
} = useAxios<Response>("/api/cmd/", {
    method: "POST",
    fetchOptions: {
        keepalive: "timeout=5s, max=1",
    },
    data: {
        command: "v1/timezone/get",
        nodeId: props.nodeId,
    },
    headers: {
        Authorization: TOKEN,
        // Connection: "Keep-Alive",
        // "Keep-Alive": "timeout=5s, max=1",
    },
    immediate: false,
});

const onTimezoneSet = async () => {
    const { data: response, then } = useAxios<Response>("/api/cmd/", {
        data: {
            command: "v1/timezone/set",
            nodeId: props.nodeId,
            args: {
                timezone: formTimezone.value,
            },
        },
        method: "POST",
        server: false,
        headers: {
            Authorization: TOKEN,
        },
    });

    then((response) => {
        if (response.error) {
            console.error("Response is not ok");
        }
        commandData.value = response.data.value;
        console.log(response.data);
    });
};
onMounted(() => {
    fetchTimezone();
});
</script>
<template>
    <div v-if="commandData" class="bg-[#222228] rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Настройки времени</h2>
        <div class="space-y-4">
            <InfoItem label="Текущая таймзона" :value="commandData.data?.timezone" />

            <div class="p-4 bg-[#37343D] rounded-lg">
                <form @submit.prevent="onTimezoneSet" class="space-y-3">
                    <label class="block text-sm font-medium text-gray-300">Изменить таймзону</label>
                    <select v-model="formTimezone" class="w-full bg-[#45434d] border border-[#555461] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                        <option v-for="timezone in Intl.supportedValuesOf('timeZone')" :value="timezone" :key="timezone" :selected="timezone === commandData.data?.timezone">
                            {{ timezone }}
                        </option>
                    </select>

                    <button
                        type="submit"
                        v-show="commandData.data?.timezone !== formTimezone"
                        class="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        :disabled="commandData.data?.timezone === formTimezone">
                        Применить
                    </button>
                </form>
            </div>
        </div>
    </div>
    <div v-if="error">
        {{ error }}
    </div>
</template>
