<!-- components/AppHeader.vue -->
<template>
  <header class="bg-linear-to-r from-[#452587] to-[#470ABF] h-20 content-center text-white shadow-md sticky top-0 z-50">
    <div class="mx-auto flex items-center justify-between p-4">
      <div class="flex items-center space-x-2">
        <img src="@/assets/Logo.svg" alt="Logo" class="h-8 w-8" />
        <span class="font-bold text-lg">{{ headerTitle }}</span>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Кнопки навигации -->
        <div v-if="showNavigationButtons" class="flex gap-3">
          <button 
            v-if="showDevicesButton"
            @click="navigateToDevices"
            class="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            Устройства
          </button>
          <button 
            v-if="showOrganizationsButton"
            @click="navigateToOrganizations"
            class="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            Организации
          </button>
        </div>
        
        <!-- Информация о пользователе (если нужно) -->
        <!-- <div class="text-right">
          <div class="text-sm">
            Добро пожаловать, <span class="font-semibold">{{ userInfo?.username || 'Пользователь' }}!</span>
          </div>
          <div v-if="userInfo?.role" class="text-xs opacity-75">
            {{ userInfo.role === 'admin' ? 'Администратор' : 'Пользователь' }}
          </div>
        </div> -->
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Определяем, какие кнопки показывать в зависимости от текущего маршрута
const showNavigationButtons = computed(() => {
  return route.path.startsWith('/organizations') || route.path === '/';
});

const showDevicesButton = computed(() => {
  return route.path.startsWith('/organizations') || route.path.startsWith('/');
});

const showOrganizationsButton = computed(() => {
  return route.path === '/' || route.path.startsWith('/');
});

const headerTitle = computed(() => {
  if (route.path.startsWith('/organizations')) return 'Организации';
  if (route.path.startsWith('/')) return 'Устройства';
  return 'Устройства'; // по умолчанию
});

const navigateToDevices = () => {
  router.push('/');
};

const navigateToOrganizations = () => {
  router.push('/organizations');
};
</script>