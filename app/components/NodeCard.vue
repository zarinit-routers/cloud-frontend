<script setup>
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});
</script>
<template>
  <div class="node-card">
    <span class="bg-[#222228] p-4 rounded-lg text-white font-bold cursor-pointer ">
      <NuxtLink :to="`/nodes/${props.node.id}`" class="">
        <div>{{ node.name }}</div>
      </NuxtLink>
      dadw
    </span>

  </div>
</template>
