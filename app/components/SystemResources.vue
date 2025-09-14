<template>
  <div class="bg-[#222228] rounded-xl p-6">
    <h2 class="text-lg font-semibold mb-4">Ресурсы системы</h2>
    <div class="space-y-4">
      <ResourceItem 
        v-if="memoryInfo"
        label="Память"
        :used="memoryInfo.used"
        :total="memoryInfo.total"
        :usagePercent="memoryInfo.usagePercent"
      />
      
      <ResourceItem 
        v-if="diskInfo"
        label="Дисковое пространство"
        :used="diskInfo.used"
        :total="diskInfo.total"
        :usagePercent="diskInfo.usagePercent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ResourceItem from '@/components/ResourceItem.vue'

defineProps<{
  memoryInfo: any
  diskInfo: any
}>()
</script>