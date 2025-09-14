<script setup lang="ts">
import { TOKEN } from "@/consts";
import SearchOrg from "~/components/organization/SearchOrg.vue";

// Типы данных
interface Organization {
  id: string;
  name: string;
  passphrase: string;
  creationDate: string;
  lastUpdate: string;
  users?: UserOrganization[];
}

interface UserOrganization {
  userId: string;
  organizationId: string;
  createdAt: string;
  user?: User;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Загрузка списка организаций
const { data: organizations, error, refresh } = await useFetch<{ organizations: Organization[] }>("/api/organizations/", {
  server: false,
  headers: {
    Authorization: TOKEN,
  },
});

// Реактивный список отфильтрованных организаций
const filteredOrganizations = ref<Organization[]>([]);

// Обработчик фильтрации
const handleFiltered = (orgs: Organization[]) => {
  filteredOrganizations.value = orgs;
};

// Функция для удаления организации
const deleteOrganization = async (orgId: string) => {
  if (!confirm('Вы уверены, что хотите удалить организацию?')) {
    return;
  }

  try {
    await useFetch("/api/organizations/delete", {
      method: "POST",
      body: {
        id: orgId
      },
      headers: {
        Authorization: TOKEN,
      },
    });
    
    // Обновляем список после удаления
    refresh();
  } catch (error) {
    console.error("Ошибка удаления организации:", error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#1a1a1f] text-white p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Управление организациями</h1>
      <NuxtLink to="/organizations/new" class="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        + Создать организацию
      </NuxtLink>
    </div>

    <SearchOrg 
      :organizations="organizations?.organizations" 
      @filtered="handleFiltered"
    />
  
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <!-- Отображаем отфильтрованные организации или все, если фильтры не применены -->
      <div 
        v-for="org in (filteredOrganizations.length > 0 ? filteredOrganizations : organizations?.organizations)" 
        :key="org.id" 
        class="bg-[#222228] rounded-xl p-6 hover:bg-[#2a2a30] transition-colors cursor-pointer"
      >
        <NuxtLink :to="`/organizations/${org.id}`" class="block mb-4">
          <h2 class="text-lg font-semibold text-blue-400 hover:text-blue-300">{{ org.name }}</h2>
        </NuxtLink>
        
        <div class="space-y-2 text-sm text-gray-300">
          <p>ID: {{ org.id }}</p>
          <p>Создана: {{ new Date(org.creationDate).toLocaleDateString() }}</p>
          <p>Обновлена: {{ new Date(org.lastUpdate).toLocaleDateString() }}</p>
          <p>Пользователей: {{ org.users?.length || 0 }}</p>
        </div>

        <div class="mt-4 flex gap-2">
          <NuxtLink 
            :to="`/organizations/${org.id}`"
            class="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700 transition-colors"
          >
            Подробнее
          </NuxtLink>
          <button 
            @click.stop="deleteOrganization(org.id)"
            class="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <div v-if="organizations?.organizations?.length === 0" class="text-center py-12 text-gray-400">
      Организации не найдены. Создайте первую организацию.
    </div>
  </div>
</template>