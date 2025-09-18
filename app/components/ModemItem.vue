<template>
  <div class="bg-[#37343D] rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold">{{ modemName }}</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          class="sr-only peer" 
          :checked="modem.enabled" 
          @change="handleToggle"
          :disabled="isLoading"
        >
        <div 
          class="w-11 h-6 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" 
          :class="modem.enabled ? 'bg-green-600 peer-checked:after:translate-x-full' : 'bg-gray-700'"
          :style="isLoading ? 'opacity: 0.5;' : ''"
        ></div>
      </label>
    </div>
    
    <div class="text-sm space-y-2">
      <div class="flex justify-between">
        <span class="text-gray-400">Статус:</span>
        <span :class="modem.enabled ? 'text-green-400' : 'text-red-400'">
          {{ modem.enabled ? 'Активен' : 'Неактивен' }}
        </span>
      </div>
      
      <div v-if="modem.sim" class="flex justify-between">
        <span class="text-gray-400">SIM:</span>
        <span class="text-gray-300">{{ modem.sim }}</span>
      </div>
      
      <div v-if="modem.signal" class="flex justify-between">
        <span class="text-gray-400">Сигнал:</span>
        <span class="text-gray-300">{{ modem.signal }} dBm</span>
      </div>

      <div v-if="modem.id" class="flex justify-between">
        <span class="text-gray-400">ID:</span>
        <span class="text-gray-300 text-xs">{{ modem.id }}</span>
      </div>
    </div>
    
    <button 
      @click="$emit('getSignal')"
      :disabled="isLoading"
      class="mt-3 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ isLoading ? 'Загрузка...' : 'Проверить сигнал' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modem: any
}>()

const emit = defineEmits<{
  toggle: [enabled: boolean]
  getSignal: []
}>()

const isLoading = ref(false);

const modemName = computed(() => {
  return props.modem.name || props.modem.id || 'Неизвестный модем';
});

const handleToggle = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  isLoading.value = true;
  try {
    await emit('toggle', target.checked);
  } catch (error) {
    console.error('Ошибка переключения модема:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>