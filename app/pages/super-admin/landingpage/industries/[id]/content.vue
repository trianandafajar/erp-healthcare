<script setup lang="ts">
import { ref } from 'vue'
import ContentEditor from '~/components/dashboard/landingpage/ContentEditor.vue'

definePageMeta({
    layout: 'superadmin',
    middleware: ['authorize'],
    permissions: ['landingpage.industries.edit'],
})

useSeoMeta({
    title: 'Edit Industry Content',
})

const route = useRoute()
const id = route.params.id as string

const { data: industry, pending } = await useFetch<{ industry: any }>(`/api/superadmin/landingpage/industries`, {
    key: `industry-${id}`,
})

const industryData = computed(() => {
    const list = industry.value?.industries ?? []
    return list.find((i: any) => i.id === id) ?? null
})

const { data: detailContent, pending: detailPending } = await useFetch<any>(
    `/api/superadmin/landingpage/industries/${id}/detail`
)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')
const loading = ref(false)

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

async function handleSave(content: any) {
    loading.value = true
    try {
        await $fetch(`/api/superadmin/landingpage/industries/${id}/detail`, {
            method: 'PUT',
            body: { content }
        })
        notify('Content saved successfully')
        await navigateTo('/super-admin/landingpage/industries')
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}

function handleCancel() {
    navigateTo('/super-admin/landingpage/industries')
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex align-center ga-3">
            <v-btn icon="mdi-arrow-left" variant="text" density="comfortable" @click="handleCancel" />
            <div>
                <v-card-title class="text-h3" v-if="industryData">
                    Edit Content: {{ industryData.title }}
                </v-card-title>
                <v-card-subtitle class="mt-1">
                    Manage sections for the industry detail page
                </v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <div v-if="pending || detailPending" class="d-flex justify-center py-16">
        <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="!industryData" class="d-flex justify-center py-16 text-medium-emphasis">
        Industry not found
    </div>

    <ContentEditor v-else :content="detailContent" :loading="loading"
        @save="handleSave" @cancel="handleCancel" />

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
