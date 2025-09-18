<template>
  <div class="bg-[#222228] rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Модемы и SIM карты</h2>
      <button 
        @click="$emit('refreshModems')"
        class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <span>🔄</span>
        Обновить
      </button>
    </div>
    
    <div v-if="modemsList.length > 0" class="space-y-4">
      <ModemItem 
        v-for="(modem, index) in modemsList" 
        :key="modem.dbus-path || index" 
        :modem="modem"
        @toggle="(enabled) => $emit('toggleModem', getModemId(modem), enabled)"
        @getSignal="$emit('getSignal', getModemId(modem))"
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

    <!-- Статистика -->
    <div v-if="modemsList.length > 0" class="mt-6 pt-4 border-t border-gray-600">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-400">{{ activeModemsCount }}</div>
          <div class="text-gray-400">Активных</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-400">{{ modemsList.length }}</div>
          <div class="text-gray-400">Всего</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Определяем props
defineProps<{
  modemsList: any[]
}>()

defineEmits<{
  toggleModem: [id: string, enabled: boolean]
  getSignal: [id: string]
  refreshModems: []
}>()

// Получаем ID модема из dbus-path
const getModemId = (modem: any) => {
  const dbusPath = modem.dbusPath || modem.dbus_path || modem['dbus-path'] || '';
  return dbusPath ? dbusPath.split('/').pop() : modem.id || 'unknown';
}

// Считаем активные модемы - теперь используем переданный prop
const activeModemsCount = computed(() => {
  const modems = (props as any).modemsList || [];
  return modems.filter((modem: any) => 
    (modem.generic?.['power-state'] === 'on' || modem.powerState === 'on') && 
    modem.generic?.sim && 
    modem.generic.sim !== '--'
  ).length;
});
</script>