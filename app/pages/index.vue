<script setup lang="ts">
import { TOKEN } from "@/consts";
const { data: connected, error } = await useFetch<{ nodes: Node[] }>("/api/clients/", {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});
</script>

<template>
    <div class="flex gap-4 m-5">
        <NodeCard class="" v-for="node in connected?.nodes" :node="node"></NodeCard>
    </div>
</template>
