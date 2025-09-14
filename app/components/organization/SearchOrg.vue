<script setup lang="ts">
interface Organization {
  id: string;
  name: string;
  passphrase: string;
  creationDate: string;
  lastUpdate: string;
  users?: any[];
}

interface Props {
  organizations?: Organization[];
}

const props = defineProps<Props>();
const emit = defineEmits(['filtered']);

const searchQuery = ref('');

const filteredOrganizations = computed(() => {
  if (!props.organizations || !searchQuery.value) {
    return props.organizations || [];
  }

  const query = searchQuery.value.toLowerCase();
  return props.organizations.filter(org => 
    org.name.toLowerCase().includes(query) ||
    org.id.toLowerCase().includes(query) ||
    org.passphrase.toLowerCase().includes(query)
  );
});

watch(filteredOrganizations, (orgs) => {
  emit('filtered', orgs);
});
</script>

<template>
  <div class="bg-[#222228] rounded-xl p-4">
    <div class="flex items-center gap-3">
      <div class="flex-1 relative">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Поиск организаций..."
          class="w-full bg-[#37343D] border border-[#555461] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>
      <span class="text-sm text-gray-400">
        Найдено: {{ filteredOrganizations.length }}
      </span>
    </div>
  </div>
</template>