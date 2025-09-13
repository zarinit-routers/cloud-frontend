<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: '-'
  }
});
</script>

<template>
  <div class="flex justify-between items-center py-2 border-b border-[#37343D] last:border-b-0">
    <span class="text-gray-400 text-sm">{{ label }}:</span>
    <span class="text-white font-mono text-sm">{{ value || '-' }}</span>
  </div>
</template>