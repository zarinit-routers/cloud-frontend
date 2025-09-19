<template>
  <div class="rounded-lg p-4 border-2 transition-all duration-300" :class="modemCardClasses">
    <!-- Заголовок с логотипом провайдера -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" 
             :class="providerLogoClasses">
          {{ providerLogoText }}
        </div>
        <h3 class="font-semibold">{{ providerName }}</h3>
      </div>
      
      <label class="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          class="sr-only peer" 
          :checked="isModemEnabled" 
          @change="handleToggle"
          :disabled="isLoading || !hasSimCard"
        >

        <div 
          class="w-11 h-6 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" 
          :class="[
            isModemEnabled ? 'bg-green-600 peer-checked:after:translate-x-full' : 'bg-gray-600',
            (!hasSimCard || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        ></div>
      </label>
    </div>
    
    <!-- Основная информация -->
    <div class="text-sm space-y-2 mb-3">
      <!-- Статус -->
      <div class="flex justify-between">
        <span class="text-gray-400">Статус:</span>
        <span :class="statusClasses">
          {{ statusText }}
        </span>
      </div>
      
      <!-- Сигнал -->
      <div v-if="hasSignal && isModemEnabled" class="flex justify-between items-center">
        <span class="text-gray-400">Сигнал:</span>
        <div class="flex items-center gap-1">
          <span class="text-gray-300">{{ modem.generic['signal-quality']?.value }}%</span>
          <div class="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-300" 
              :class="signalStrengthColor"
              :style="{ width: signalPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Технологии -->
      <div v-if="accessTechnologies.length > 0 && isModemEnabled" class="flex justify-between">
        <span class="text-gray-400">Технологии:</span>
        <span class="text-gray-300">{{ accessTechnologies.join(', ') }}</span>
      </div>
      
      <!-- IMEI -->
      <div v-if="modem['3gpp']?.imei && modem['3gpp']?.imei !== '--'" class="flex justify-between">
        <span class="text-gray-400">IMEI:</span>
        <span class="text-gray-300 text-xs">{{ modem['3gpp']?.imei }}</span>
      </div>
      
      <!-- APN -->
      <div v-if="apn && isModemEnabled" class="flex justify-between">
        <span class="text-gray-400">APN:</span>
        <span class="text-gray-300 text-xs">{{ apn }}</span>
      </div>
    </div>
    
    <!-- Кнопки действий -->
    <div class="flex gap-2">
      <button 
        v-if="isModemEnabled && hasSimCard"
        @click="$emit('getSignal')"
        :disabled="isLoading"
        class="flex-1 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="providerButtonClasses"
      >
        {{ isLoading ? '...' : 'Сигнал' }}
      </button>
      
      <button 
        v-if="!hasSimCard"
        class="flex-1 px-3 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-700 transition-colors"
        disabled
      >
        Нет SIM-карты
      </button>

      <button 
        v-if="!isModemEnabled && hasSimCard"
        class="flex-1 px-3 py-1 bg-gray-600 rounded text-sm cursor-not-allowed"
        disabled
      >
        Модем выключен
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modem: any
}>()

const emit = defineEmits<{
  toggle: [enabled: boolean]
  getSignal: []
  update: []
}>()

const isLoading = ref(false);
const lastActionSuccess = ref<boolean | null>(null);
const showStatusMessage = ref(false);

// Показываем статусное сообщение на 3 секунды
const showTempStatus = (success: boolean) => {
  lastActionSuccess.value = success;
  showStatusMessage.value = true;
  setTimeout(() => {
    showStatusMessage.value = false;
  }, 3000);
};

// Определяем провайдера по operator-name или operator-code
const providerInfo = computed(() => {
  const opName = props.modem['3gpp']?.['operator-name'] || '';
  const opCode = props.modem['3gpp']?.['operator-code'] || '';
  
  if (opName.includes('MegaFon') || opCode === '25002') {
    return { name: 'МегаФон', color: 'green', logo: 'М' };
  }
  if (opName.includes('MTS') || opCode === '25001') {
    return { name: 'МТС', color: 'red', logo: 'М' };
  }
  if (opName.includes('Tele2') || opCode === '25020') {
    return { name: 'Tele2', color: 'purple', logo: 'T2' };
  }
  if (opName.includes('Beeline') || opCode === '25099') {
    return { name: 'Билайн', color: 'yellow', logo: 'Б' };
  }
  if (opName.includes('YOTA') || opCode === '25011') {
    return { name: 'YOTA', color: 'blue', logo: 'Y' };
  }
  
  return { name: 'Неизвестно', color: 'gray', logo: '?' };
});

// Классы для карточки based on provider
const modemCardClasses = computed(() => {
  const base = 'border-2 bg-gradient-to-br from-opacity-20 to-opacity-10 backdrop-blur-sm';
  
  switch (providerInfo.value.color) {
    case 'green': return `${base} border-green-500/30 from-green-500/10 to-green-600/5 hover:border-green-400/50`;
    case 'red': return `${base} border-red-500/30 from-red-500/10 to-red-600/5 hover:border-red-400/50`;
    case 'purple': return `${base} border-purple-500/30 from-purple-500/10 to-purple-600/5 hover:border-purple-400/50`;
    case 'yellow': return `${base} border-yellow-500/30 from-yellow-500/10 to-yellow-600/5 hover:border-yellow-400/50`;
    case 'blue': return `${base} border-blue-500/30 from-blue-500/10 to-blue-600/5 hover:border-blue-400/50`;
    default: return `${base} border-gray-500/30 from-gray-500/10 to-gray-600/5`;
  }
});

// Классы для кнопок
const providerButtonClasses = computed(() => {
  switch (providerInfo.value.color) {
    case 'green': return 'hover:bg-green-700';
    case 'red': return 'hover:bg-red-700';
    case 'purple': return 'hover:bg-purple-700';
    case 'yellow': return 'hover:bg-yellow-700';
    case 'blue': return 'hover:bg-blue-700';
    default: return '';
  }
});

// Классы для логотипа провайдера
const providerLogoClasses = computed(() => {
  switch (providerInfo.value.color) {
    case 'green': return 'bg-gradient-to-br from-green-600 to-green-700 shadow-lg shadow-green-600/25';
    case 'red': return 'bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/25';
    case 'purple': return 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-600/25';
    case 'yellow': return 'bg-gradient-to-br from-yellow-600 to-yellow-700 shadow-lg shadow-yellow-600/25';
    case 'blue': return 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25';
    default: return 'bg-gradient-to-br from-gray-600 to-gray-700';
  }
});

const providerName = computed(() => providerInfo.value.name);
const providerLogoText = computed(() => providerInfo.value.logo);

// Статус модема - используем только generic.state
const hasSimCard = computed(() => {
  const sim = props.modem.generic?.sim;
  return sim && sim !== '--' && sim !== '/' && sim !== '';
});

// Используем только generic.state для определения состояния модема
const isModemEnabled = computed(() => {
  const state = props.modem.generic?.state;
  // Модем включен, если состояние не 'disabled' и не 'failed'
  return state && state !== 'disabled' && state !== 'failed' && state !== 'unknown';
});

const statusText = computed(() => {
  if (!hasSimCard.value) return 'Нет SIM-карты';
  
  const state = props.modem.generic?.state;
  if (!state || state === 'disabled') return 'Выключен';
  if (state === 'registered') return 'Активен';
  if (state === 'connecting') return 'Подключение';
  if (state === 'failed') return 'Ошибка';
  if (state === 'searching') return 'Поиск сети';
  
  return state;
});

const statusClasses = computed(() => {
  if (!hasSimCard.value) return 'text-yellow-400';
  
  const state = props.modem.generic?.state;
  if (!state || state === 'disabled') return 'text-gray-400';
  if (state === 'registered') return 'text-green-400';
  if (state === 'connecting' || state === 'searching') return 'text-blue-400';
  if (state === 'failed') return 'text-red-400';
  
  return 'text-gray-400';
});

// Информация о сигнале
const hasSignal = computed(() => {
  return props.modem.generic?.['signal-quality']?.value && props.modem.generic['signal-quality'].value !== '0';
});

const signalPercentage = computed(() => {
  const signal = parseInt(props.modem.generic?.['signal-quality']?.value || '0');
  return Math.min(Math.max(signal, 0), 100);
});

const signalStrengthColor = computed(() => {
  const signal = signalPercentage.value;
  if (signal > 70) return 'bg-green-500';
  if (signal > 40) return 'bg-yellow-500';
  return 'bg-red-500';
});

// Технологии доступа
const accessTechnologies = computed(() => {
  const techs = props.modem.generic?.['access-technologies'] || [];
  return techs.map(tech => {
    switch (tech) {
      case 'lte': return 'LTE';
      case 'umts': return '3G';
      case 'hsdpa': return 'HSPA';
      case 'hsupa': return 'HSPA+';
      case 'gsm': return '2G';
      default: return tech.toUpperCase();
    }
  });
});

// APN информация
const apn = computed(() => {
  return props.modem['3gpp']?.eps?.['initial-bearer']?.settings?.apn || '--';
});

const handleToggle = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!hasSimCard.value) return;
  
  isLoading.value = true;
  try {
    await emit('toggle', target.checked);
    showTempStatus(true);
    // Запрашиваем обновление данных после успешного переключения
    setTimeout(() => emit('update'), 1000);
  } catch (error) {
    console.error('Ошибка переключения модема:', error);
    showTempStatus(false);
  } finally {
    isLoading.value = false;
  }
};

// Следим за изменениями модема для автоматического обновления
watch(() => props.modem, () => {
  // При изменении данных модема сбрасываем статус загрузки
  isLoading.value = false;
}, { deep: true });
</script>

<style scoped>
.gradient-border {
  position: relative;
  background: linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

.status-message {
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
  animation: fadeInOut 3s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; transform: translateY(-10px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>