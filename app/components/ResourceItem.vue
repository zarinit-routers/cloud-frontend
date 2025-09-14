<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <span class="text-gray-400">{{ label }}</span>
      <span class="text-sm text-gray-300">{{ used }} / {{ total }}</span>
    </div>
    <div class="w-full bg-[#37343D] rounded-full h-2">
      <div 
        class="h-2 rounded-full transition-all duration-300"
        :class="progressColor"
        :style="{ width: usagePercent + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  used: string
  total: string
  usagePercent: number
}>()

const progressColor = computed(() => {
  if (props.usagePercent < 70) return 'bg-green-500'
  if (props.usagePercent < 90) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>