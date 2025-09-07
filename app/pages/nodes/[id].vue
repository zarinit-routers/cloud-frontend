<script setup lang="ts">
import type { Node } from "@/models";
import { TOKEN } from "@/consts";

const route = useRoute();
const id = computed(() => route.params.id);
const { data, error } = (await useFetch)<{ node: Node }>(() => "/api/clients/" + id.value, {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});
if (error) {
    console.error(error.value);
}
const { commandData } = (await useFetch)<{}>(() => "/api/cmd/v1/timezone/get", {
    body: { nodeId: id.value },
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});
</script>
<template>
    <div>
        <h1>{{ data?.node.name }}</h1>
        <div>{{ data?.node.id }}</div>

        <div>{{ commandData.data.timezone }}</div>
    </div>
</template>
