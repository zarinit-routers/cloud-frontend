<script setup lang="ts">
import type { Response as Command } from "@/models";
const props = defineProps({ resp: { type: Command, required: true } });
</script>
<template>
    <div v-if="resp">
        <div v-if="resp.data">
            <slot :data="resp.data"></slot>
        </div>
        <div v-if="resp.requestError">{{ resp.requestError }}</div>
        <div v-if="resp.commandError">{{ resp.commandError }}</div>
        <div v-if="resp">
            <form @submit.prevent="onTimezoneSet">
                <select v-model="formTimezone">
                    <option v-for="timezone in Intl.supportedValuesOf('timeZone')" :selected="timezone == resp.data.timezone" :key="timezone">{{ timezone }}</option>
                </select>
                <input type="submit" value="Применить" v-show="resp.data.timezone != formTimezone" />
            </form>
        </div>
    </div>
</template>
