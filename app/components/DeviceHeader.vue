<template>
    <div class="flex items-center justify-between mb-6">
        <div>
            <NuxtLink to="/" class="hover:underline cursor-pointer"><- Назад</NuxtLink>
            <h1 class="text-2xl font-bold">
                {{ node.name || "Устройство" }}
            </h1>
            <p class="text-gray-400 text-sm">{{ deviceInfo.manufacturer }} {{ deviceInfo.model }} {{ deviceInfo.firmwareVersion }}</p>
        </div>

        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :class="node?.connected ? 'bg-green-500' : 'bg-red-500'"></div>
                <span class="text-sm text-gray-400">{{ node?.connected ? "Онлайн" : "Не в сети" }}</span>
            </div>

            <button title="Обновить данные" @click="$emit('refresh')" class="cursor-pointer p-2 bg-[#37343D] rounded-lg hover:bg-[#45434d] transition-colors" :disabled="isLoading">
                <span v-if="isLoading" class="animate-spin">⟳</span>
                <span v-else>🔄</span>
            </button>

            <span v-if="lastUpdated" class="text-sm text-gray-400"> Обновлено: {{ formatTime(lastUpdated) }} </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Node } from "~/models";

defineProps<{
    nodeName?: string;
    deviceInfo: any;
    hasError: boolean;
    isLoading: boolean;
    lastUpdated?: number | null;
    node: Node;
}>();

defineEmits<{
    refresh: [];
}>();

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
};
</script>
