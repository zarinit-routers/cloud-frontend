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
    const { data: commandData } = await useFetch<Response>("/api/cmd/v1/timezone/set", {
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
    });
};

onMounted(async () => {});
console.log(commandData.value);
</script>
<template>
    <div>
        <h1>{{ data?.node.name }}</h1>
        <div>{{ data?.node.id }}</div>

        <div v-if="commandData">
            <div v-if="commandData.data">
                Timezone: <span>{{ commandData.data.timezone }}</span>
            </div>
            <div v-if="commandData.requestError">{{ commandData.requestError }}</div>
            <div v-if="commandData.commandError">{{ commandData.commandError }}</div>
            <div v-if="commandData">
                <form @submit.prevent="onTimezoneSet">
                    <select v-model="formTimezone">
                        <option v-for="timezone in Intl.supportedValuesOf('timeZone')" :selected="timezone == commandData.data.timezone" :key="timezone">{{ timezone }}</option>
                    </select>
                    <input type="submit" value="Применить" v-show="commandData.data.timezone != formTimezone" />
                </form>
            </div>
        </div>
    </div>
</template>
