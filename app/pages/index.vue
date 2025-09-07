<script setup lang="ts">
import { TOKEN } from "@/consts";
const { data: connected, error } = await useFetch<{ nodes: Node[] }>("/api/clients/", {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});
if (error) {
    console.error(error.value);
}
</script>

<template>
    <h1 class="text-sm">Zarinit routers</h1>
    <div class="flex">
        <NodeCard v-for="node in connected?.nodes" :node="node"></NodeCard>
    </div>
</template>
