<script setup lang="ts">
import { TOKEN } from "@/consts";

const form = ref({
  name: ''
});

const isLoading = ref(false);
const errorMessage = ref('');

const createOrganization = async () => {
  if (!form.value.name.trim()) {
    errorMessage.value = 'Название организации обязательно';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const { data } = await useFetch("/api/organizations/new", {
      method: "POST",
      body: form.value,
      headers: {
        Authorization: TOKEN,
      },
    });
    console.log("Ответ сервера:", data.value);
    console.log("Ошибка:", error.value);

    
    // Перенаправляем на страницу созданной организации
  } catch (error) {
  
  } finally {
    navigateTo(`/organizations/`);
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#1a1a1f] text-white p-4">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/organizations" class="text-blue-400 hover:text-blue-300">
        ← Назад к списку
      </NuxtLink>
      <h1 class="text-2xl font-bold">Создание организации</h1>
    </div>

    <div class="max-w-md mx-auto bg-[#222228] rounded-xl p-6">
      <form @submit.prevent="createOrganization" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Название организации</label>
          <input 
            v-model="form.name" 
            type="text" 
            required
            placeholder="Введите название организации"
            class="w-full bg-[#37343D] border border-[#555461] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          {{ errorMessage }}
        </div>

        <div class="flex gap-3">
          <NuxtLink 
            to="/organizations"
            class="flex-1 px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            Отмена
          </NuxtLink>
          <button 
            type="submit"
            :disabled="isLoading"
            class="flex-1 px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ isLoading ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>