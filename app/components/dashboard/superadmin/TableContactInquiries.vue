<script setup lang="ts">
import { MailOutlined } from '@ant-design/icons-vue'
import { useNotifications } from '~/composables/useNotifications'

type Inquiry = {
    id: string
    name: string
    email: string
    subject: string | null
    message: string
    replied: boolean
    replied_at: string | null
    reply_body: string | null
    created_at: string
}

const error = ref<string | null>(null)
const expanded = ref<string | null>(null)
const replyDialog = ref(false)
const selectedInquiry = ref<Inquiry | null>(null)
const replyBody = ref('')
const sending = ref(false)

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const queryParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: search.value || undefined,
}))

const { data, pending, refresh } = await useFetch<{
    inquiries: Inquiry[]
    total: number
    totalPages: number
}>('/api/superadmin/contact-inquiries', { query: queryParams })

const inquiries = computed(() => data.value?.inquiries ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const totalInquiries = computed(() => data.value?.total ?? 0)

watch([search, currentPage], () => { refresh() })

function toggleExpand(id: string) {
    expanded.value = expanded.value === id ? null : id
}

function openReply(inquiry: Inquiry) {
    selectedInquiry.value = inquiry
    replyBody.value = ''
    replyDialog.value = true
}

async function sendReply() {
    if (!selectedInquiry.value || !replyBody.value.trim()) return
    sending.value = true
    try {
        await $fetch(`/api/superadmin/contact-inquiries/${selectedInquiry.value.id}/reply`, {
            method: 'POST',
            body: { reply_body: replyBody.value },
        })
        await refresh()
        replyDialog.value = false
        selectedInquiry.value = null
        replyBody.value = ''
    } catch (e: any) {
        error.value = e.message ?? 'Failed to send reply'
    } finally {
        sending.value = false
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>

<template>
    <v-card flat class="pa-6">
        <v-row class="mb-4" align="center">
            <v-col cols="12" sm="6">
                <h2 class="text-h5 font-weight-bold">Contact Inquiries</h2>
                <p class="text-body-2 text-grey mb-0">
                    Manage and respond to inquiries from the landing page contact form.
                </p>
            </v-col>
            <v-col cols="12" sm="6" class="text-sm-end">
                <v-btn variant="outlined" color="primary" @click="refresh" :loading="pending">
                    <template #prepend>
                        <v-icon icon="mdi-refresh" />
                    </template>
                    Refresh
                </v-btn>
            </v-col>
        </v-row>

        <v-row class="mb-4">
            <v-col cols="12" sm="4">
                <v-text-field v-model="search" density="compact" variant="outlined" placeholder="Search inquiries..."
                    hide-details clearable prepend-inner-icon="mdi-magnify" @update:model-value="currentPage = 1" />
            </v-col>
        </v-row>

        <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">
            {{ error }}
        </v-alert>

        <v-table class="rounded-md" hover>
            <thead>
                <tr>
                    <th style="width: 40px;"></th>
                    <th class="text-left font-weight-bold">Name</th>
                    <th class="text-left font-weight-bold">Email</th>
                    <th class="text-left font-weight-bold">Subject</th>
                    <th class="text-left font-weight-bold">Date</th>
                    <th class="text-center font-weight-bold">Status</th>
                    <th class="text-center font-weight-bold">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending" v-for="i in 5" :key="i">
                    <td colspan="7" style="border-bottom: none;">
                        <v-skeleton-loader type="table-row" class="my-1" />
                    </td>
                </tr>
                <tr v-else-if="inquiries.length === 0">
                    <td colspan="7" class="text-center text-grey py-8">
                        <v-icon icon="mdi-inbox-outline" size="40" class="mb-2" color="grey-lighten-1" />
                        <p class="text-body-2">No inquiries found.</p>
                    </td>
                </tr>
                <template v-for="inquiry in inquiries" :key="inquiry.id">
                    <tr @click="toggleExpand(inquiry.id)" class="cursor-pointer" style="cursor: pointer;">
                        <td>
                            <v-icon icon="mdi-chevron-down" size="20" color="grey"
                                :style="{ transform: expanded === inquiry.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }" />
                        </td>
                        <td class="font-weight-medium">{{ inquiry.name }}</td>
                        <td>{{ inquiry.email }}</td>
                        <td>
                            <span v-if="inquiry.subject" class="text-truncate d-inline-block" style="max-width: 200px;">
                                {{ inquiry.subject }}
                            </span>
                            <span v-else class="text-grey">—</span>
                        </td>
                        <td class="text-body-2">{{ formatDate(inquiry.created_at) }}</td>
                        <td class="text-center">
                            <v-chip :color="inquiry.replied ? 'success' : 'warning'" size="small" variant="tonal">
                                {{ inquiry.replied ? 'Replied' : 'Pending' }}
                            </v-chip>
                        </td>
                        <td class="text-center">
                            <v-btn v-if="!inquiry.replied" icon size="small" color="primary" variant="text"
                                @click.stop="openReply(inquiry)" :title="'Reply to ' + inquiry.name">
                                <v-icon icon="mdi-reply" />
                            </v-btn>
                            <v-btn v-else icon size="small" color="grey" variant="text" disabled>
                                <v-icon icon="mdi-check" />
                            </v-btn>
                        </td>
                    </tr>
                    <tr v-if="expanded === inquiry.id">
                        <td colspan="7" class="pa-4 bg-grey-lighten-4">
                            <div class="text-body-2 mb-2">
                                <strong>Message:</strong>
                            </div>
                            <p class="text-body-2 mb-4" style="white-space: pre-wrap;">{{ inquiry.message }}</p>
                            <div v-if="inquiry.replied" class="mt-3 pt-3" style="border-top: 1px solid #ddd;">
                                <div class="text-body-2 mb-2">
                                    <strong>Your Reply:</strong>
                                    <span class="text-grey ms-2">({{ formatDate(inquiry.replied_at!) }})</span>
                                </div>
                                <p class="text-body-2" style="white-space: pre-wrap;">{{ inquiry.reply_body }}</p>
                            </div>
                        </td>
                    </tr>
                </template>
            </tbody>
        </v-table>

        <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" class="mt-4" size="small" />
    </v-card>

    <v-dialog v-model="replyDialog" max-width="600" persistent>
        <v-card>
            <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-3">
                <MailOutlined class="me-2" />
                Reply to {{ selectedInquiry?.name }}
            </v-card-title>
            <v-card-text class="pa-4">
                <div class="text-body-2 mb-3 text-grey">
                    Sending reply to: <strong>{{ selectedInquiry?.email }}</strong>
                </div>
                <div v-if="selectedInquiry?.subject" class="text-body-2 mb-3 text-grey">
                    Subject: <strong>{{ selectedInquiry.subject }}</strong>
                </div>
                <div class="text-body-2 mb-3 text-grey">
                    Original message:
                </div>
                <div class="text-body-2 mb-4 pa-3 bg-grey-lighten-4 rounded" style="white-space: pre-wrap;">
                    {{ selectedInquiry?.message }}
                </div>
                <v-textarea v-model="replyBody" variant="outlined" label="Your Reply" rows="6" hide-details
                    placeholder="Type your reply here..." />
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
                <v-spacer />
                <v-btn variant="text" color="grey" @click="replyDialog = false" :disabled="sending">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" @click="sendReply" :loading="sending"
                    :disabled="!replyBody.trim() || sending"
                    :style="sending || !replyBody.trim() ? 'cursor: not-allowed; pointer-events: auto;' : ''">
                    <template #prepend>
                        <v-icon icon="mdi-send" />
                    </template>
                    Send Reply
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
