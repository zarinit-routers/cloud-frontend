<script setup lang="ts">
interface Props {
  show: boolean;
  title?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:show']);

const closeModal = () => {
  emit('update:show', false);
};
</script>

<template>
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-[#222228] rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
      <div class="flex justify-between items-center p-4 border-b border-[#37343D]">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      <div class="p-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>