<template>
  <div class="bg-[#37343D] rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold">{{ modem.name || modem.id }}</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          class="sr-only peer" 
          :checked="modem.enabled" 
          @change="$emit('toggle', !modem.enabled)"
        >
        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
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
    </div>
    
    <button 
      @click="$emit('getSignal')"
      class="mt-3 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors"
    >
      Проверить сигнал
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modem: any
}>()

defineEmits<{
  toggle: [enabled: boolean]
  getSignal: []
}>()
</script>