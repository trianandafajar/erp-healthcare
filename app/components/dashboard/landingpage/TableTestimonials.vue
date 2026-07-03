<script setup lang="ts">
import { ref, computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'
import TestimonialModal from './TestimonialModal.vue'

interface Testimonial {
    id: string
    name: string
    role: string
    institution: string
    quote: string
    rating: number
    image_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

const { can } = usePermission()

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data, pending, refresh } = await useFetch<{ testimonials: Testimonial[] }>('/api/admin/landingpage/testimonials')

const testimonials = computed(() => data.value?.testimonials ?? [])

const filteredTestimonials = computed(() => {
    if (!search.value) return testimonials.value
    const q = search.value.toLowerCase()
    return testimonials.value.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.institution.toLowerCase().includes(q) ||
        t.quote.toLowerCase().includes(q)
    )
})

const paginatedTestimonials = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredTestimonials.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredTestimonials.value.length / itemsPerPage))

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function onSearch() {
    currentPage.value = 1
}

const dialog = ref(false)
const modalMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedTestimonial = ref<Testimonial | null>(null)
const loading = ref(false)
const actionLoading = computed(() => loading.value || pending.value)

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

function openAdd() {
    modalMode.value = 'add'
    selectedTestimonial.value = null
    dialog.value = true
}

function openEdit(testimonial: Testimonial) {
    modalMode.value = 'edit'
    selectedTestimonial.value = testimonial
    dialog.value = true
}

function openDelete(testimonial: Testimonial) {
    modalMode.value = 'delete'
    selectedTestimonial.value = testimonial
    dialog.value = true
}

function closeModal() {
    dialog.value = false
    selectedTestimonial.value = null
}

async function handleSubmit(payload: any) {
    loading.value = true
    try {
        if (modalMode.value === 'add') {
            await $fetch('/api/admin/landingpage/testimonials', {
                method: 'POST',
                body: {
                    name: payload.name,
                    role: payload.role,
                    institution: payload.institution,
                    quote: payload.quote,
                    rating: payload.rating,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                },
            })
            notify('Testimonial created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/admin/landingpage/testimonials/${payload.id}`, {
                method: 'PATCH',
                body: {
                    name: payload.name,
                    role: payload.role,
                    institution: payload.institution,
                    quote: payload.quote,
                    rating: payload.rating,
                    image_url: payload.image_url,
                    sort_order: payload.sort_order,
                },
            })
            notify('Testimonial updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/admin/landingpage/testimonials/${payload.id}`, {
                method: 'DELETE',
            })
            notify('Testimonial deleted successfully')
        }
        await refreshNuxtData()
        closeModal()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Something went wrong', 'error')
    } finally {
        loading.value = false
    }
}

function getStars(rating: number) {
    const stars = []
    for (let i = 1; i <= 5; i++) {
        stars.push(i <= rating)
    }
    return stars
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center">
            <div>
                <v-card-title class="text-h3">Testimonial Management</v-card-title>
                <v-card-subtitle class="mt-1">Manage customer testimonials displayed on the landing
                    page</v-card-subtitle>
            </div>
            <v-btn v-if="can('landingpage.testimonials.create')" color="primary" variant="flat" size="large"
                prepend-icon="mdi-plus" density="comfortable" @click="openAdd">
                Add Testimonial
            </v-btn>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center gap-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search by name, role, or institution..."
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 280px" @update:model-value="onSearch" />
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Person</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Institution</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Quote</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Rating</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Active</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Created</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="8" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedTestimonials.length === 0">
                    <td colspan="8" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No testimonials found
                    </td>
                </tr>
                <tr v-else v-for="testimonial in paginatedTestimonials" :key="testimonial.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="40" rounded="lg" color="grey-lighten-3">
                                <v-img v-if="testimonial.image_url" :src="testimonial.image_url" cover />
                                <v-icon v-else icon="mdi-account-outline" size="24" color="grey-lighten-1" />
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ testimonial.name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ testimonial.role }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2">{{ testimonial.role }}</span>
                    </td>
                    <td class="py-3">
                        <span class="text-body-2 font-weight-medium">{{ testimonial.institution }}</span>
                    </td>
                    <td class="py-3">
                        <div class="text-body-2 text-medium-emphasis"
                            style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            "{{ testimonial.quote }}"
                        </div>
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-center gap-1">
                            <svg v-for="(star, i) in getStars(testimonial.rating)" :key="i"
                                class="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span class="text-caption text-medium-emphasis ml-1">{{ testimonial.rating }}/5</span>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip :color="testimonial.is_active ? 'success' : 'error'" variant="tonal" size="small">
                            {{ testimonial.is_active ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2 text-medium-emphasis">
                        {{ formatDate(testimonial.created_at) }}
                    </td>
                    <td class="py-3 text-right">
                        <v-btn v-if="can('landingpage.testimonials.edit')" icon="mdi-pencil-outline" variant="text"
                            size="small" color="primary" density="comfortable" @click="openEdit(testimonial)" />
                        <v-btn v-if="can('landingpage.testimonials.delete')" icon="mdi-delete-outline" variant="text"
                            size="small" color="error" density="comfortable" @click="openDelete(testimonial)" />
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedTestimonials.length }} of {{ filteredTestimonials.length }} testimonials
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="6"
                density="compact" size="small" />
        </div>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="540" persistent>
        <TestimonialModal :mode="modalMode" :testimonial="selectedTestimonial" :loading="actionLoading"
            @submit="handleSubmit" @cancel="closeModal" />
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
