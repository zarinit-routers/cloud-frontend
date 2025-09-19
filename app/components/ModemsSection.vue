<template>
  <div class="bg-[#222228] rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Модемы и SIM карты</h2>
      <div class="flex items-center gap-2">
        <div v-if="refreshStatus" class="text-sm px-2 py-1 rounded" :class="refreshStatusClass">
          {{ refreshStatus }}
        </div>
        <button 
          @click="handleRefresh"
          class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          :disabled="isRefreshing"
        >
          <span v-if="isRefreshing" class="animate-spin">⟳</span>
          <span v-else>🔄</span>
          {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
        </button>
      </div>
    </div>
    
    <div v-if="modemsList.length > 0" class="space-y-4">
      <ModemItem 
        v-for="(modem, index) in modemsList" 
        :key="modem.dbus-path || index" 
        :modem="modem"
        @toggle="(enabled) => handleToggleModem(getModemId(modem), enabled)"
        @getSignal="handleGetSignal(getModemId(modem))"
        @update="handleUpdateModems"
      />
    </div>
    
    <div v-else class="text-center py-8 text-gray-400">
      <div class="text-4xl mb-2">📱</div>
      <p>Модемы не найдены</p>
      <button 
        @click="handleRefresh"
        class="mt-3 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        :disabled="isRefreshing"
      >
        {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
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
import { computed, ref } from 'vue';

// Определяем props
const props = defineProps<{
  modemsList: any[]
}>()

const emit = defineEmits<{
  toggleModem: [id: string, enabled: boolean]
  getSignal: [id: string]
  refreshModems: []
  updateModems: []
}>()

const isRefreshing = ref(false);
const refreshStatus = ref<string | null>(null);
const refreshStatusClass = ref('');

// Получаем ID модема из dbus-path
const getModemId = (modem: any) => {
  const dbusPath = modem.dbusPath || modem.dbus_path || modem['dbus-path'] || '';
  return dbusPath ? dbusPath.split('/').pop() : modem.id || 'unknown';
}

// Считаем активные модемы
const activeModemsCount = computed(() => {
  const modems = props.modemsList || [];
  return modems.filter((modem: any) => 
    (modem.generic?.['power-state'] === 'on' || modem.powerState === 'on') && 
    modem.generic?.sim && 
    modem.generic.sim !== '--'
  ).length;
});

const handleToggleModem = async (id: string, enabled: boolean) => {
  try {
    await emit('toggleModem', id, enabled);
  } catch (error) {
    console.error('Ошибка переключения модема:', error);
  }
};

const handleGetSignal = async (id: string) => {
  try {
    await emit('getSignal', id);
    // Показываем статус успешного обновления сигнала
    showRefreshStatus('Сигнал обновлен', 'success');
  } catch (error) {
    console.error('Ошибка получения сигнала:', error);
    showRefreshStatus('Ошибка обновления сигнала', 'error');
  }
};

const handleRefresh = async () => {
  isRefreshing.value = true;
  try {
    await emit('refreshModems');
    showRefreshStatus('Модемы обновлены', 'success');
  } catch (error) {
    console.error('Ошибка обновления модемов:', error);
    showRefreshStatus('Ошибка обновления', 'error');
  } finally {
    isRefreshing.value = false;
  }
};

const handleUpdateModems = () => {
  emit('updateModems');
};

const showRefreshStatus = (message: string, type: 'success' | 'error') => {
  refreshStatus.value = message;
  refreshStatusClass.value = type === 'success' 
    ? 'bg-green-500/20 text-green-400' 
    : 'bg-red-500/20 text-red-400';
  
  setTimeout(() => {
    refreshStatus.value = null;
  }, 3000);
};


</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>