<template>
  <div class="bg-[#222228] rounded-xl p-6">
    <h2 class="text-lg font-semibold mb-4">Модемы и SIM карты</h2>
    
    <div v-if="modemsList.length > 0" class="space-y-4">
      <ModemItem 
        v-for="modem in modemsList" 
        :key="modem.id" 
        :modem="modem"
        @toggle="(enabled) => $emit('toggleModem', modem.id, enabled)"
        @getSignal="$emit('getSignal', modem.id)"
      />
    </div>
    
    <div v-else class="text-center py-8 text-gray-400">
      <div class="text-4xl mb-2">📱</div>
      <p>Модемы не найдены</p>
      <button 
        @click="$emit('refreshModems')"
        class="mt-3 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Обновить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModemItem from "@/components/ModemItem.vue";

defineProps<{
  modemsList: any[]
}>()

defineEmits<{
  toggleModem: [id: string, enabled: boolean]
  getSignal: [id: string]
  refreshModems: []
}>()
</script>