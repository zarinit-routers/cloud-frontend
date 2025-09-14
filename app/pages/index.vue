<script setup lang="ts">
import { TOKEN } from "@/consts";
const { data: connected, error } = await useFetch<{ nodes: Node[] }>("/api/clients/", {
    server: false,
    headers: {
        Authorization: TOKEN,
    },
});


// Реактивный список отфильтрованных устройств
const filteredNodes = ref<any[]>([]);

// Обработчик фильтрации
const handleFiltered = (nodes: any[]) => {
  filteredNodes.value = nodes;
};
</script>

<template>
    <div>
    <SearchBar 
      :nodes="connected?.nodes" 
      @filtered="handleFiltered"
    />
  </div>
  
  <div class="flex gap-4 m-5">
    <!-- Отображаем отфильтрованные устройства или все, если фильтры не применены -->
    <NodeCard 
      v-for="node in (filteredNodes.length > 0 ? filteredNodes : connected?.nodes)" 
      :key="node.id" 
      :node="node" 
    />
  </div>
</template>
