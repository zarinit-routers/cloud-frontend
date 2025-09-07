<script setup lang="ts">
import type { Node, Response } from "@/models";
import { TOKEN } from "@/consts";

const route = useRoute();
const id = computed(() => route.params.id);
const { data, error } = (await useFetch)<{ node: Node }>(() => "/api/clients/" + id.value, {
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

onMounted(async () => {});
console.log(commandData.value);
</script>
<template>
    <div>
        <h1>{{ data?.node.name }}</h1>
        <div>{{ data?.node.id }}</div>

        <div v-if="commandData">
            <div v-if="commandData.data">
                Timezone: <span class="font-">{{ commandData.data.timezone }}</span>
            </div>
            <div v-if="commandData.requestError">{{ commandData.requestError }}</div>
            <div v-if="commandData.commandError">{{ commandData.commandError }}</div>
        </div>
    </div>
</template>
