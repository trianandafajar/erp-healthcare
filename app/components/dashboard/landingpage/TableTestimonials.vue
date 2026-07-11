<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const { data, pending, refresh } = await useFetch<{
    testimonials: Testimonial[]
}>('/api/superadmin/landingpage/testimonials')

const testimonials = ref<Testimonial[]>([])

watch(data, (val) => {
    if (val?.testimonials) {
        testimonials.value = [...val.testimonials].sort((a, b) => a.sort_order - b.sort_order)
    }
}, { immediate: true })

const tbodyRef = ref<HTMLElement | null>(null)

async function handleReorder(items: Testimonial[]) {
    const updates = items.map((item, i) => ({ id: item.id, sort_order: i }))
    for (const u of updates) {
        try {
            await $fetch(`/api/superadmin/landingpage/testimonials/${u.id}`, {
                method: 'PATCH',
                body: { sort_order: u.sort_order },
            })
        } catch {
            // silent
        }
    }
}

useSortableTable(tbodyRef, testimonials, handleReorder)

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
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
            const maxSort = Math.max(...testimonials.value.map(t => t.sort_order), -1)
            await $fetch('/api/superadmin/landingpage/testimonials', {
                method: 'POST',
                body: {
                    name: payload.name,
                    role: payload.role,
                    institution: payload.institution,
                    quote: payload.quote,
                    rating: payload.rating,
                    image_url: payload.image_url,
                    sort_order: maxSort + 1,
                },
            })
            notify('Testimonial created successfully')
        } else if (modalMode.value === 'edit') {
            await $fetch(`/api/superadmin/landingpage/testimonials/${payload.id}`, {
                method: 'PATCH',
                body: {
                    name: payload.name,
                    role: payload.role,
                    institution: payload.institution,
                    quote: payload.quote,
                    rating: payload.rating,
                    image_url: payload.image_url,
                },
            })
            notify('Testimonial updated successfully')
        } else if (modalMode.value === 'delete') {
            await $fetch(`/api/superadmin/landingpage/testimonials/${payload.id}`, {
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
        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th style="width:36px" class="text-left text-caption font-weight-bold text-uppercase"></th>
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
            <tbody ref="tbodyRef">
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="9" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="testimonials.length === 0">
                    <td colspan="9" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-account-off-outline" size="32" class="mb-2 d-block mx-auto" />
                        No testimonials found
                    </td>
                </tr>
                <tr v-else v-for="testimonial in testimonials" :key="testimonial.id">
                    <td class="py-3 drag-handle text-center" style="cursor:grab">
                        <v-icon icon="mdi-drag" size="18" color="text-medium-emphasis" />
                    </td>
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
                Showing {{ testimonials.length }} testimonials
            </span>
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

<style scoped>
.sortable-ghost {
    opacity: 0.3;
    background: rgb(var(--v-theme-primary-light)) !important;
}

.sortable-drag {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}
</style>
