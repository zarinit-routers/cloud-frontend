<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Пропсы для получения списка всех устройств
const props = defineProps<{
  nodes?: any[]
}>()

// Эмиты для передачи отфильтрованных данных
const emit = defineEmits(['filtered'])

// Реактивные данные
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const availableTags = ref<string[]>([])
const isTagsDropdownOpen = ref(false)

// Извлекаем все уникальные теги из устройств
const extractAllTags = computed(() => {
  if (!props.nodes) return []
  
  const allTags = new Set<string>()
  props.nodes.forEach(node => {
    if (node.tags && Array.isArray(node.tags)) {
      node.tags.forEach(tag => {
        if (tag.tag) allTags.add(tag.tag)
      })
    }
  })
  return Array.from(allTags).sort()
})

// Обновляем доступные теги при изменении nodes
watch(() => props.nodes, () => {
  availableTags.value = extractAllTags.value
}, { immediate: true })

// Фильтрация устройств
const filteredNodes = computed(() => {
  if (!props.nodes) return []
  
  return props.nodes.filter(node => {
    // Фильтр по поисковому запросу
    const matchesSearch = searchQuery.value === '' || 
      node.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    // Фильтр по тегам
    const matchesTags = selectedTags.value.length === 0 || 
      (node.tags && node.tags.some((tag: any) => 
        selectedTags.value.includes(tag.tag)
      ))
    
    return matchesSearch && matchesTags
  })
})

// Отслеживаем изменения фильтрации и отправляем родителю
watch(filteredNodes, (newValue) => {
  emit('filtered', newValue)
}, { immediate: true })

// Обработчики для тегов
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const clearAllTags = () => {
  selectedTags.value = []
}

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<template>
  <div class="search-filter-container">
    <!-- Поисковая строка -->
    <div class="search-box">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по устройствам..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-button"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Фильтры по тегам -->
    <div class="filters-section">
      <div class="filters-header">
        <h3 class="filters-title">Теги устройств:</h3>
        <button
          v-if="selectedTags.length > 0"
          @click="clearAllTags"
          class="clear-all-button"
        >
          Очистить все
        </button>
      </div>

      <!-- Выбранные теги -->
      <div v-if="selectedTags.length > 0" class="selected-tags">
        <span
          v-for="tag in selectedTags"
          :key="tag"
          class="selected-tag"
          @click="toggleTag(tag)"
        >
          {{ tag }}
          <span class="remove-tag">×</span>
        </span>
      </div>

      <!-- Доступные теги -->
      <div class="available-tags-container">
        <div class="tags-grid">
          <span
            v-for="tag in availableTags"
            :key="tag"
            :class="['tag', { 'tag-selected': selectedTags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Сообщение, если тегов нет -->
      <div v-if="availableTags.length === 0" class="no-tags-message">
        Теги не найдены
      </div>
    </div>

    <!-- Информация о результатах -->
    <div v-if="props.nodes" class="results-info">
      Найдено устройств: {{ filteredNodes.length }} из {{ props.nodes.length }}
    </div>
  </div>
</template>

<style scoped>
.search-filter-container {
  background: #222228;
  border-radius: 12px;
  padding: 20px;
  margin: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-box {
  margin-bottom: 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  background: #37343D;
  border: 1px solid #45434d;
  border-radius: 8px;
  color: white;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.clear-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-button:hover {
  color: white;
}

.filters-section {
  margin-bottom: 16px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filters-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0;
}

.clear-all-button {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.clear-all-button:hover {
  background: rgba(99, 102, 241, 0.1);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #6366f1;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.selected-tag:hover {
  background: #4f46e5;
}

.remove-tag {
  font-size: 14px;
  font-weight: bold;
  margin-left: 4px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.tag {
  display: inline-block;
  background: #37343D;
  color: #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid #45434d;
}

.tag:hover {
  background: #45434d;
  border-color: #6366f1;
}

.tag-selected {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.no-tags-message {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.results-info {
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .search-filter-container {
    margin: 10px;
    padding: 16px;
  }
  
  .tags-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>