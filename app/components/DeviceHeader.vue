<template>
    <div class="flex items-center justify-between mb-6">
        <div>
            <NuxtLink to="/" class="hover:underline cursor-pointer"><- Назад</NuxtLink>
            <h1 class="text-2xl font-bold">
                {{ nodeName || "Устройство" }}
            </h1>
            <p class="text-gray-400 text-sm">{{ deviceInfo.manufacturer }} {{ deviceInfo.model }} {{ deviceInfo.firmwareVersion }}</p>
        </div>

        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :class="hasError ? 'bg-red-500' : 'bg-green-500'"></div>
                <span class="text-sm text-gray-400">{{ hasError ? "Ошибка" : "Онлайн" }}</span>
            </div>

            <button @click="$emit('refresh')" class="p-2 bg-[#37343D] rounded-lg hover:bg-[#45434d] transition-colors" :disabled="isLoading">
                <span v-if="isLoading" class="animate-spin">⟳</span>
                <span v-else>🔄</span>
            </button>

            <span v-if="lastUpdated" class="text-sm text-gray-400"> Обновлено: {{ formatTime(lastUpdated) }} </span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    nodeName?: string;
    deviceInfo: any;
    hasError: boolean;
    isLoading: boolean;
    lastUpdated?: number | null;
}>();

defineEmits<{
    refresh: [];
}>();

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
};
</script>
