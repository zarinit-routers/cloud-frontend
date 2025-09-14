<script setup lang="ts">
import { TOKEN } from "@/consts";

interface Organization {
  id: string;
  name: string;
  passphrase: string;
  creationDate: string;
  lastUpdate: string;
  members: Member[];
}

interface Member {
  userId: string;
  createdAt: string;
  user?: User;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const route = useRoute();
const id = computed(() => route.params.id);

// Загрузка данных организации
const { data: organization, error, refresh: refreshOrg } = await useFetch<Organization>(
  () => `/api/organizations/${id.value}`,
  {
    server: false,
    headers: {
      Authorization: TOKEN,
    },
  }
);

// Загрузка всех пользователей
const { data: usersResponse } = await useFetch<{ users: User[] }>("/api/auth/users", {
  server: false,
  headers: {
    Authorization: TOKEN,
  },
});

// Извлекаем массив пользователей из ответа
const allUsers = computed(() => usersResponse.value?.users || []);

// Состояния для модальных окон
const showEditModal = ref(false);
const showAddUsersModal = ref(false);
const showRemoveUsersModal = ref(false);
const showPassphraseModal = ref(false);

// Данные для форм
const editForm = ref({
  id: organization.value?.id || '',
  name: organization.value?.name || ''
});

const addUsersForm = ref({
  id: organization.value?.id || '',
  users: [] as string[]
});

const removeUsersForm = ref({
  id: organization.value?.id || '',
  users: [] as string[]
});

const newPassphrase = ref('');

// Функции для работы с выбором пользователей
const toggleUserForAdd = (userId: string) => {
  const index = addUsersForm.value.users.indexOf(userId);
  if (index > -1) {
    addUsersForm.value.users.splice(index, 1);
  } else {
    addUsersForm.value.users.push(userId);
  }
};

const toggleUserForRemove = (userId: string) => {
  const index = removeUsersForm.value.users.indexOf(userId);
  if (index > -1) {
    removeUsersForm.value.users.splice(index, 1);
  } else {
    removeUsersForm.value.users.push(userId);
  }
};

// Получаем информацию о пользователе по ID
const getUserInfo = (userId: string) => {
  return allUsers.value.find(user => user.id === userId);
};

// Функция обновления организации
const updateOrganization = async () => {
  try {
    const { data } = await useFetch("/api/organizations/update", {
      method: "POST",
      body: editForm.value,
      headers: {
        Authorization: TOKEN,
      },
    });
    
    showEditModal.value = false;
    refreshOrg();
  } catch (error) {
    console.error("Ошибка обновления организации:", error);
  }
};

// Функция генерации нового паспфразы
const generatePassphrase = async () => {
  try {
    const { data } = await useFetch("/api/organizations/generate-passphrase", {
      method: "POST",
      body: { id: id.value },
      headers: {
        Authorization: TOKEN,
      },
    });
    
    newPassphrase.value = data.value?.passphrase || '';
    showPassphraseModal.value = true;
  } catch (error) {
    console.error("Ошибка генерации парольной фразы:", error);
  }
};

// Функция добавления пользователей
const addUsers = async () => {
  try {
    await useFetch("/api/organizations/add-users", {
      method: "POST",
      body: addUsersForm.value,
      headers: {
        Authorization: TOKEN,
      },
    });
    
    showAddUsersModal.value = false;
    refreshOrg();
    addUsersForm.value.users = [];
  } catch (error) {
    console.error("Ошибка добавления пользователей:", error);
  }
};

// Функция удаления пользователей
const removeUsers = async () => {
  try {
    await useFetch("/api/organizations/remove-users", {
      method: "POST",
      body: removeUsersForm.value,
      headers: {
        Authorization: TOKEN,
      },
    });
    
    showRemoveUsersModal.value = false;
    refreshOrg();
    removeUsersForm.value.users = [];
  } catch (error) {
    console.error("Ошибка удаления пользователей:", error);
  }
};

// Функция удаления организации
const deleteOrganization = async () => {
  if (!confirm('Вы уверены, что хотите удалить организацию?')) {
    return;
  }

  try {
    await useFetch("/api/organizations/delete", {
      method: "POST",
      body: { id: id.value },
      headers: {
        Authorization: TOKEN,
      },
    });
    
    navigateTo('/organizations');
  } catch (error) {
    console.error("Ошибка удаления организации:", error);
  }
};

// Сбрасываем выбор при закрытии модальных окон
watch(showAddUsersModal, (show) => {
  if (!show) {
    addUsersForm.value.users = [];
  }
});

watch(showRemoveUsersModal, (show) => {
  if (!show) {
    removeUsersForm.value.users = [];
  }
});

// Обновляем форму при изменении данных организации
watch(organization, (newOrg) => {
  if (newOrg) {
    editForm.value = {
      id: newOrg.id,
      name: newOrg.name
    };
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#1a1a1f] text-white p-4">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/organizations" class="text-[#8c8c8e] hover:text-[#a5a5a7] transition-colors">
        ← Назад к списку
      </NuxtLink>
      <h1 class="text-2xl font-bold">Организация: {{ organization?.name }}</h1>
    </div>

    <div v-if="organization" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Информация об организации -->
      <div class="bg-[#222228] rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Информация об организации</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">ID:</span>
            <span class="font-mono">{{ organization.id }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Название:</span>
            <span>{{ organization.name }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Дата создания:</span>
            <span>{{ new Date(organization.creationDate).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Последнее обновление:</span>
            <span>{{ new Date(organization.lastUpdate).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Паспфраза:</span>
            <span class="font-mono text-sm">{{ organization.passphrase }}</span>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <button 
            @click="showEditModal = true"
            class="w-full px-4 py-2 bg-[#37343D] rounded-lg hover:bg-[#44434D] transition-colors border border-[#555461]"
          >
            Редактировать
          </button>
          <button 
            @click="generatePassphrase"
            class="w-full px-4 py-2 bg-[#37343D] rounded-lg hover:bg-[#44434D] transition-colors border border-[#555461]"
          >
            Сгенерировать новую паспфразу
          </button>
          <button 
            @click="deleteOrganization"
            class="w-full px-4 py-2 bg-[#4a1e1e] rounded-lg hover:bg-[#5a2a2a] transition-colors border border-[#6a3636]"
          >
            Удалить организацию
          </button>
        </div>
      </div>

      <!-- Пользователи организации -->
      <div class="bg-[#222228] rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Участники ({{ organization.members?.length || 0 }})</h2>
          <div class="flex gap-2">
            <button 
              @click="showAddUsersModal = true"
              class="px-3 py-1 bg-[#37343D] rounded text-sm hover:bg-[#44434D] transition-colors border border-[#555461]"
            >
              Добавить
            </button>
            <button 
              @click="showRemoveUsersModal = true"
              :disabled="!organization.members || organization.members.length === 0"
              class="px-3 py-1 bg-[#37343D] rounded text-sm hover:bg-[#44434D] transition-colors border border-[#555461] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Удалить
            </button>
          </div>
        </div>

        <div v-if="organization.members && organization.members.length > 0" class="space-y-3">
          <div 
            v-for="member in organization.members" 
            :key="member.userId"
            class="bg-[#2a2a30] rounded-lg p-3"
          >
            <div class="flex justify-between items-center">
              <div>
                <template v-if="getUserInfo(member.userId)">
                  <p class="font-semibold">{{ getUserInfo(member.userId)?.username }}</p>
                  <p class="text-sm text-gray-400">{{ getUserInfo(member.userId)?.email }}</p>
                  <p class="text-xs text-gray-500">Роль: {{ getUserInfo(member.userId)?.role }}</p>
                </template>
                <template v-else>
                  <p class="font-semibold">User {{ member.userId }}</p>
                  <p class="text-sm text-gray-400">ID: {{ member.userId }}</p>
                </template>
              </div>
              <span class="text-xs text-gray-500">
                Добавлен: {{ new Date(member.createdAt).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400">
          Участники не найдены
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12 text-red-400">
      Ошибка загрузки организации
    </div>
    <div v-else class="text-center py-12 text-gray-400">
      Загрузка...
    </div>

    <!-- Модальное окно редактирования -->
    <Modal v-model:show="showEditModal" title="Редактировать организацию">
      <form @submit.prevent="updateOrganization" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Название</label>
          <input 
            v-model="editForm.name" 
            type="text" 
            required
            class="w-full bg-[#37343D] border border-[#555461] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#8c8c8e]"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button 
            type="button" 
            @click="showEditModal = false"
            class="px-4 py-2 bg-[#37343D] rounded-lg hover:bg-[#44434D] transition-colors border border-[#555461]"
          >
            Отмена
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-[#2a2a30] rounded-lg hover:bg-[#37343D] transition-colors border border-[#555461]"
          >
            Сохранить
          </button>
        </div>
      </form>
    </Modal>

    <!-- Модальное окно добавления пользователей -->
    <Modal v-model:show="showAddUsersModal" title="Добавить участников">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Выберите пользователей для добавления ({{ addUsersForm.users.length }} выбрано)
          </label>
          
          <div v-if="allUsers.length > 0" class="max-h-60 overflow-y-auto bg-[#37343D] rounded-lg border border-[#555461]">
            <div 
              v-for="user in allUsers" 
              :key="user.id"
              class="p-3 border-b border-[#555461] last:border-b-0 hover:bg-[#44434D] cursor-pointer"
              :class="{ 'bg-[#2a2a30]': addUsersForm.users.includes(user.id) }"
              @click="toggleUserForAdd(user.id)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ user.username }}</p>
                  <p class="text-sm text-gray-400">{{ user.email }}</p>
                  <p class="text-xs text-gray-500">Роль: {{ user.role }}</p>
                  <p class="text-xs text-gray-500">ID: {{ user.id }}</p>
                </div>
                <div 
                  class="w-5 h-5 border-2 border-[#555461] rounded flex items-center justify-center"
                  :class="{ 
                    'bg-[#8c8c8e] border-[#8c8c8e]': addUsersForm.users.includes(user.id),
                    'text-white': addUsersForm.users.includes(user.id)
                  }"
                >
                  <span v-if="addUsersForm.users.includes(user.id)">✓</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4 text-gray-400">
            Пользователи не найдены
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button 
            type="button" 
            @click="showAddUsersModal = false"
            class="px-4 py-2 bg-[#37343D] rounded-lg hover:bg-[#44434D] transition-colors border border-[#555461]"
          >
            Отмена
          </button>
          <button 
            @click="addUsers"
            :disabled="addUsersForm.users.length === 0"
            class="px-4 py-2 bg-[#2a2a30] rounded-lg hover:bg-[#37343D] transition-colors border border-[#555461] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Добавить выбранных
          </button>
        </div>
      </div>
    </Modal>

    <!-- Модальное окно удаления пользователей -->
    <Modal v-model:show="showRemoveUsersModal" title="Удалить участников">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Выберите участников для удаления ({{ removeUsersForm.users.length }} выбрано)
          </label>
          
          <div v-if="organization?.members && organization.members.length > 0" class="max-h-60 overflow-y-auto bg-[#37343D] rounded-lg border border-[#555461]">
            <div 
              v-for="member in organization.members" 
              :key="member.userId"
              class="p-3 border-b border-[#555461] last:border-b-0 hover:bg-[#44434D] cursor-pointer"
              :class="{ 'bg-[#4a1e1e]': removeUsersForm.users.includes(member.userId) }"
              @click="toggleUserForRemove(member.userId)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <template v-if="getUserInfo(member.userId)">
                    <p class="font-medium">{{ getUserInfo(member.userId)?.username }}</p>
                    <p class="text-sm text-gray-400">{{ getUserInfo(member.userId)?.email }}</p>
                    <p class="text-xs text-gray-500">Роль: {{ getUserInfo(member.userId)?.role }}</p>
                  </template>
                  <template v-else>
                    <p class="font-medium">User {{ member.userId }}</p>
                    <p class="text-sm text-gray-400">ID: {{ member.userId }}</p>
                  </template>
                  <p class="text-xs text-gray-500">
                    Добавлен: {{ new Date(member.createdAt).toLocaleDateString() }}
                  </p>
                </div>
                <div 
                  class="w-5 h-5 border-2 border-[#555461] rounded flex items-center justify-center"
                  :class="{ 
                    'bg-[#8c8c8e] border-[#8c8c8e]': removeUsersForm.users.includes(member.userId),
                    'text-white': removeUsersForm.users.includes(member.userId)
                  }"
                >
                  <span v-if="removeUsersForm.users.includes(member.userId)">✓</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4 text-gray-400">
            В организации нет участников
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button 
            type="button" 
            @click="showRemoveUsersModal = false"
            class="px-4 py-2 bg-[#37343D] rounded-lg hover:bg-[#44434D] transition-colors border border-[#555461]"
          >
            Отмена
          </button>
          <button 
            @click="removeUsers"
            :disabled="removeUsersForm.users.length === 0"
            class="px-4 py-2 bg-[#4a1e1e] rounded-lg hover:bg-[#5a2a2a] transition-colors border border-[#6a3636] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Удалить выбранных
          </button>
        </div>
      </div>
    </Modal>

    <!-- Модальное окно новой паспфразы -->
    <Modal v-model:show="showPassphraseModal" title="Новая паспфраза">
      <div class="space-y-4">
        <p class="text-gray-300">Новая паспфраза для организации:</p>
        <div class="bg-[#37343D] rounded-lg p-4">
          <code class="font-mono text-lg break-all">{{ newPassphrase }}</code>
        </div>
        <p class="text-sm text-gray-400">Сохраните эту паспфразу в безопасном месте!</p>
        <div class="flex justify-end">
          <button 
            @click="showPassphraseModal = false"
            class="px-4 py-2 bg-[#2a2a30] rounded-lg hover:bg-[#37343D] transition-colors border border-[#555461]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>