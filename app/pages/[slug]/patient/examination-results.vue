<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: ['authorize'],
    permissions: ['examination.view'],
})
const { can } = usePermission()
useSeoMeta({
    title: 'Examination Results',
    description: 'Patient examination results page',
})

type ExaminationResult = {
    id: string
    date: string
    type: string
    doctor: string
    status: 'Ready' | 'Pending' | string
    fileName: string
    department: string
    summary: string
    requestedBy: string
    notes: string
}

const { data, pending, refresh } = await useFetch<{ examinationResults: ExaminationResult[] }>('/api/patient/examination-results')

const examinationResults = computed<ExaminationResult[]>(() => data.value?.examinationResults ?? [])
const snackbar = ref(false)
const snackbarMessage = ref('')
const search = ref('')
const statusFilter = ref('all')
const detailDialog = ref(false)
const selectedResult = ref<ExaminationResult | null>(null)

const filteredResults = computed(() =>
    examinationResults.value.filter((item) => {
        const keyword = search.value.toLowerCase()
        const matchSearch =
            item.type.toLowerCase().includes(keyword) ||
            item.doctor.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword)
        const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
        return matchSearch && matchStatus
    })
)

function statusColor(status: string) {
    return status === 'Ready' ? 'success' : 'warning'
}

function openDetail(item: ExaminationResult) {
    selectedResult.value = item
    detailDialog.value = true
}

async function handleDownload(fileId: string, fileName: string) {
    snackbarMessage.value = `Preparing download for ${fileName}`
    snackbar.value = true

    const { data, error } = await useFetch<{ url: string }>(`/api/patient/examination-results/${fileId}/url`)

    if (error.value) {
        snackbarMessage.value = `Failed to prepare download: ${error.value.message}`
        snackbar.value = true
        return
    }

    const url = data.value?.url
    if (url) window.open(url, '_blank')
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div class="min-w-0">
            <h2 class="text-h5 text-md-h3 mb-1">Examination Results</h2>
            <p class="text-medium-emphasis mb-0">View and download your available examination reports.</p>
        </div>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Results Archive">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 px-4 py-3">
            <v-text-field v-model="search" placeholder="Search result type, doctor, or department"
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 380px" />
            <v-btn-toggle v-model="statusFilter" mandatory density="compact" variant="tonal" color="primary"
                class="flex-wrap">
                <v-btn value="all">All</v-btn>
                <v-btn value="Ready">Ready</v-btn>
                <v-btn value="Pending">Pending</v-btn>
            </v-btn-toggle>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th class="text-no-wrap">Date</th>
                    <th class="text-no-wrap">Type</th>
                    <th class="text-no-wrap">Department</th>
                    <th class="text-no-wrap">Doctor</th>
                    <th class="text-no-wrap">Status</th>
                    <th class="text-no-wrap text-right">Download</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredResults" :key="item.id" class="cursor-pointer" @click="openDetail(item)">
                    <td>{{ formatDate(item.date) }}</td>
                    <td>{{ item.type }}</td>
                    <td>{{ item.department }}</td>
                    <td>{{ item.doctor }}</td>
                    <td>
                        <v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status
                        }}</v-chip>
                    </td>
                    <td class="text-right">
                        <v-btn v-if="can('examination.download')" size="small" variant="text" color="primary"
                            :disabled="item.status !== 'Ready'" @click.stop="handleDownload(item.id, item.fileName)">
                            Download
                        </v-btn>
                    </td>
                </tr>
                <tr v-if="filteredResults.length === 0">
                    <td colspan="6" class="text-center py-6 text-medium-emphasis">No examination result found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="detailDialog" max-width="840">
        <v-card v-if="selectedResult" rounded="lg">
            <v-card-item>
                <div class="d-flex justify-space-between align-start flex-wrap ga-3">
                    <div>
                        <v-card-title class="px-0">{{ selectedResult.type }}</v-card-title>
                        <v-card-subtitle class="px-0 mt-1">
                            {{ selectedResult.department }} | {{ selectedResult.doctor }}
                        </v-card-subtitle>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip color="primary" variant="tonal">{{ formatDate(selectedResult.date) }}</v-chip>
                        <v-chip :color="statusColor(selectedResult.status)" variant="tonal">{{ selectedResult.status
                        }}</v-chip>
                    </div>
                </div>
            </v-card-item>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">Requested By</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedResult.requestedBy }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                        <div class="text-caption text-medium-emphasis">File Name</div>
                        <div class="text-body-1 font-weight-medium">{{ selectedResult.fileName }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Result Summary</div>
                        <div class="text-body-2">{{ selectedResult.summary }}</div>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-caption text-medium-emphasis mb-1">Clinical Notes</div>
                        <v-alert color="info" variant="tonal" rounded="lg">
                            {{ selectedResult.notes }}
                        </v-alert>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
