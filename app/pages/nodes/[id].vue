<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";

const route = useRoute();
const id = computed(() => route.params.id);
const { data, error } = await useFetch<{ node: Node }>(() => "/api/clients/" + id.value, {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});
if (error.value) {
    console.error(error.value);
}
const { data: commandData } = await useFetch<Response>("/api/cmd/v1/timezone/get", {
    body: {
        nodeId: id.value,
    },
    method: "POST",
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});

const formTimezone = ref<string>(commandData.value.data.timezone);

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

onMounted(async () => {});
console.log(commandData.value);
</script>
<template>
    
    <div>
        <h1 class="m-3">{{ data?.node.name }}</h1>
        <div class="m-3">{{ data?.node.id }}</div>

        <div v-if="commandData">
            <div class="bg-[#222228] p-3 rounded-xl m-3" v-if="commandData.data">
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
    </div>
</template>
