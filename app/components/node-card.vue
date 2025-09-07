<script setup>
const props = defineProps({
    node: {
        type: Object,
        required: true,
    },
});
</script>
<template>
    <NuxtLink :to="`/nodes/${props.node.id}`" class="">
        <div>{{ props.node.name }}</div>
    </NuxtLink>
</template>
