

<script setup lang="ts">
import { TOKEN } from '~/consts'; 
const props = defineProps({
    id: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        required: true
    }
});

const newTag = ref<string>('');
const isLoading = ref<boolean>(false);
const message = ref<{ type: 'success' | 'error', text: string } | null>(null);


const addTags = async (tags: string[]) => {
    if (!tags.length) return;
    
    isLoading.value = true;
    message.value = null;
    
    try {
        const { error } = await useFetch("/api/clients/tags/add", {
            method: "POST",
            body: {
                tags: tags, id: props.id
            },
            headers: {
                Authorization: TOKEN,
            },
        });
        
        if (error.value) {
            throw error.value;
        }
        
        message.value = {
            type: 'success',
            text: 'Теги успешно добавлены'
        };
        

        // await refreshClient();
        newTag.value = '';
        
    } catch (err) {
        console.error('Ошибка при добавлении тегов:', err);
        message.value = {
            type: 'error',
            text: 'Ошибка при добавлении тегов'
        };
    } finally {
        isLoading.value = false;
    }
};


const removeTag = async (tag: string) => {
    isLoading.value = true;
    message.value = null;
    
    try {
        const { error } = await useFetch("/api/clients/tags/remove", {
            method: "POST",
            body: {
                tags: [tag.tag], id: props.id
            },
            headers: {
                Authorization: TOKEN,
            },
        });
        
        if (error.value) {
            throw error.value;
        }
        
        message.value = {
            type: 'success',
            text: 'Тег успешно удален'
        };
        

        // await refreshClient();
        
    } catch (err) {
        console.error('Ошибка при удалении тега:', err);
        message.value = {
            type: 'error',
            text: 'Ошибка при удалении тега'
        };
    } finally {
        isLoading.value = false;
    }
};


const handleAddTag = () => {
    if (newTag.value.trim()) {
        addTags([newTag.value.trim()]);
    }
};


const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTag();
    }
};

</script>

<template>
<div class="bg-[#222228] p-3 rounded-xl m-3">
            <h2 class="text-lg font-semibold mb-3">Теги устройства</h2>
            
            
            <div v-if="message" 
                 :class="['p-2 rounded mb-3 text-sm', 
                         message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300']">
                {{ message.text }}
            </div>
            
            
            <div class="mb-3">
                <span class="text-gray-400">Текущие теги: </span>
                <span v-if="tags && tags.length" class="flex flex-wrap gap-1 mt-1">
                    <span v-for="tag in tags" :key="tag" 
                         class="inline-flex items-center bg-blue-500/20 px-2 py-1 rounded text-sm">
                        {{ tag.tag }}
                        <button @click="removeTag(tag)" 
                                :disabled="isLoading"
                                class="ml-1 text-red-400 hover:text-red-300 text-xs">
                            ×
                        </button>
                    </span>
                </span>
                <span v-else class="text-gray-500 text-sm">отсутствуют</span>
            </div>
            
            
            <div class="p-1 bg-[#37343D] rounded">
                <form @submit.prevent="handleAddTag" class="flex gap-2">
                    <input 
                        v-model="newTag"
                        @keypress="handleKeyPress"
                        placeholder="Введите новый тег"
                        :disabled="isLoading"
                        class="flex-1 bg-transparent px-2 py-1 focus:outline-none"
                    />
                    <button 
                        type="submit"
                        :disabled="isLoading || !newTag.trim()"
                        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                    >
                        {{ isLoading ? '...' : 'Добавить' }}
                    </button>
                </form>
            </div>
        </div>
</template>