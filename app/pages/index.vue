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
    <div class="flex">
        <NodeCard class="gap-4" v-for="node in connected?.nodes" :node="node"></NodeCard>
    </div>
</template>
