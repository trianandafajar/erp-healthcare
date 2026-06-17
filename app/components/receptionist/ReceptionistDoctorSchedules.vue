<script setup lang="ts">
import type { ReceptionistDoctorSchedule, ScheduleStatus } from '~/data/receptionist'

const workspace = useReceptionistWorkspace()
const search = ref('')
const statusFilter = ref('All')
const departmentFilter = ref('All')
const specialtyFilter = ref('All')
const dayFilter = ref('All')
const roomFilter = ref('All')
const dialog = ref(false)
const detailDialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref('')
const selectedScheduleId = ref('')
const deleteTarget = ref<ReceptionistDoctorSchedule | null>(null)
const snackbar = ref(false)
const snackbarMessage = ref('')
const formError = ref('')

const emptyForm = () => ({
    doctorName: '',
    specialty: '',
    department: '',
    day: 'Wednesday',
    startTime: '08:00',
    endTime: '12:00',
    room: '',
    quota: 10,
    booked: 0,
    status: 'Available' as ScheduleStatus,
})

const form = reactive(emptyForm())

const selectedSchedule = computed(() => workspace.doctorSchedules.value.find((item) => item.id === selectedScheduleId.value))
const statusOptions = ['All', 'Available', 'Limited', 'Full', 'Off Duty']
const editableStatusOptions: ScheduleStatus[] = ['Available', 'Limited', 'Full', 'Off Duty']
const dayOptions = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const formDayOptions = dayOptions.filter((item) => item !== 'All')
const departmentOptions = computed(() => ['All', ...new Set(workspace.doctorSchedules.value.map((item) => item.department))])
const specialtyOptions = computed(() => ['All', ...new Set(workspace.doctorSchedules.value.map((item) => item.specialty))])
const roomOptions = computed(() => ['All', ...new Set(workspace.doctorSchedules.value.map((item) => item.room))])

const filteredSchedules = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.doctorSchedules.value.filter((item) => {
        const matchesStatus = statusFilter.value === 'All' || item.status === statusFilter.value
        const matchesDepartment = departmentFilter.value === 'All' || item.department === departmentFilter.value
        const matchesSpecialty = specialtyFilter.value === 'All' || item.specialty === specialtyFilter.value
        const matchesDay = dayFilter.value === 'All' || item.day === dayFilter.value
        const matchesRoom = roomFilter.value === 'All' || item.room === roomFilter.value
        const matchesKeyword =
            item.doctorName.toLowerCase().includes(keyword) ||
            item.specialty.toLowerCase().includes(keyword) ||
            item.department.toLowerCase().includes(keyword) ||
            item.day.toLowerCase().includes(keyword) ||
            item.room.toLowerCase().includes(keyword) ||
            item.status.toLowerCase().includes(keyword)

        return matchesStatus && matchesDepartment && matchesSpecialty && matchesDay && matchesRoom && matchesKeyword
    })
})

const summary = computed(() => ({
    total: workspace.doctorSchedules.value.length,
    available: workspace.doctorSchedules.value.filter((item) => item.status === 'Available').length,
    limited: workspace.doctorSchedules.value.filter((item) => item.status === 'Limited').length,
    full: workspace.doctorSchedules.value.filter((item) => item.status === 'Full').length,
    offDuty: workspace.doctorSchedules.value.filter((item) => item.status === 'Off Duty').length,
}))

function statusColor(status: string) {
    if (status === 'Available') return 'success'
    if (status === 'Limited') return 'warning'
    if (status === 'Full') return 'error'
    return 'secondary'
}

function quotaPercent(item: ReceptionistDoctorSchedule) {
    if (!item.quota) return 0
    return Math.min(100, Math.round((item.booked / item.quota) * 100))
}

function remainingSlots(item: ReceptionistDoctorSchedule) {
    return Math.max(0, item.quota - item.booked)
}

function resetForm() {
    Object.assign(form, emptyForm())
    formError.value = ''
}

function resetFilters() {
    search.value = ''
    statusFilter.value = 'All'
    departmentFilter.value = 'All'
    specialtyFilter.value = 'All'
    dayFilter.value = 'All'
    roomFilter.value = 'All'
}

function openCreate() {
    editingId.value = ''
    resetForm()
    dialog.value = true
}

function openEdit(item: ReceptionistDoctorSchedule) {
    editingId.value = item.id
    Object.assign(form, {
        doctorName: item.doctorName,
        specialty: item.specialty,
        department: item.department,
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        quota: item.quota,
        booked: item.booked,
        status: item.status,
    })
    formError.value = ''
    dialog.value = true
}

function openDetail(id: string) {
    selectedScheduleId.value = id
    detailDialog.value = true
}

function openDelete(item: ReceptionistDoctorSchedule) {
    deleteTarget.value = item
    deleteDialog.value = true
}

function validateForm() {
    if (!form.doctorName || !form.specialty || !form.department || !form.room) {
        return 'Doctor, specialty, department, and room are required.'
    }

    if (form.startTime >= form.endTime) {
        return 'End time must be later than start time.'
    }

    if (Number(form.quota) < 1) {
        return 'Quota must be at least 1.'
    }

    if (Number(form.booked) < 0) {
        return 'Booked slot cannot be negative.'
    }

    if (Number(form.booked) > Number(form.quota)) {
        return 'Booked slot cannot be greater than quota.'
    }

    return ''
}

function saveSchedule() {
    formError.value = validateForm()
    if (formError.value) return

    const payload = {
        doctorName: form.doctorName,
        specialty: form.specialty,
        department: form.department,
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        quota: Number(form.quota),
        booked: Number(form.booked),
        status: form.status,
    }

    if (editingId.value) {
        workspace.updateDoctorSchedule(editingId.value, payload)
        snackbarMessage.value = 'Doctor schedule has been updated.'
    } else {
        workspace.createDoctorSchedule(payload)
        snackbarMessage.value = 'Doctor schedule has been created.'
    }

    snackbar.value = true
    dialog.value = false
}

function deleteSchedule() {
    if (!deleteTarget.value) return

    workspace.deleteDoctorSchedule(deleteTarget.value.id)
    snackbarMessage.value = 'Doctor schedule has been deleted.'
    snackbar.value = true
    deleteDialog.value = false
    deleteTarget.value = null
}

function setQuickStatus(item: ReceptionistDoctorSchedule, status: ScheduleStatus) {
    workspace.updateDoctorScheduleStatus(item.id, status)
    snackbarMessage.value = `Schedule marked as ${status}.`
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Doctor Schedules</h2>
            <p class="text-medium-emphasis mb-0">Manage doctor availability, quota, practice rooms, and schedule status.</p>
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">Add Schedule</v-btn>
    </div>

    <v-row class="mb-4">
        <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Total Schedules</div>
                    <div class="text-h4">{{ summary.total }}</div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Available</div>
                    <div class="text-h4 text-success">{{ summary.available }}</div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Limited / Full</div>
                    <div class="text-h4">{{ summary.limited + summary.full }}</div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
            <v-card elevation="0" border rounded="lg">
                <v-card-text>
                    <div class="text-caption text-medium-emphasis">Off Duty</div>
                    <div class="text-h4">{{ summary.offDuty }}</div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Doctor Availability">
        <div class="px-4 py-3">
            <v-row dense>
                <v-col cols="12" md="6">
                    <v-text-field
                        v-model="search"
                        placeholder="Search doctor, specialty, department, day, room, or status"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                    />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="statusFilter" :items="statusOptions" label="Status" variant="outlined"
                        density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="departmentFilter" :items="departmentOptions" label="Department"
                        variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="specialtyFilter" :items="specialtyOptions" label="Specialty"
                        variant="outlined" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="dayFilter" :items="dayOptions" label="Day" variant="outlined"
                        density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <v-select v-model="roomFilter" :items="roomOptions" label="Room" variant="outlined"
                        density="compact" hide-details />
                </v-col>
            </v-row>
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-3">
                <div class="text-body-2 text-medium-emphasis">
                    Showing {{ filteredSchedules.length }} of {{ workspace.doctorSchedules.value.length }} schedules
                </div>
                <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-filter-remove-outline"
                    @click="resetFilters">
                    Reset Filters
                </v-btn>
            </div>
        </div>

        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Doctor</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Quota</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredSchedules" :key="item.id">
                    <td>
                        <div class="font-weight-medium">{{ item.doctorName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.specialty }} - {{ item.department }}</div>
                    </td>
                    <td>{{ item.day }}</td>
                    <td>{{ item.startTime }} - {{ item.endTime }}</td>
                    <td>{{ item.room }}</td>
                    <td>
                        <div class="d-flex align-center ga-2">
                            <v-progress-linear
                                :model-value="quotaPercent(item)"
                                height="8"
                                rounded
                                :color="statusColor(item.status)"
                                style="width: 90px"
                            />
                            <span class="text-body-2">{{ item.booked }}/{{ item.quota }}</span>
                        </div>
                        <div class="text-caption text-medium-emphasis">{{ remainingSlots(item) }} slots left</div>
                    </td>
                    <td>
                        <v-chip size="small" variant="tonal" :color="statusColor(item.status)">{{ item.status }}</v-chip>
                    </td>
                    <td class="text-right">
                        <div class="d-flex justify-end ga-2">
                            <v-tooltip text="View detail">
                                <template #activator="{ props }">
                                    <v-btn v-bind="props" icon="mdi-eye-outline" size="small" color="secondary"
                                        variant="tonal" aria-label="View detail" @click="openDetail(item.id)" />
                                </template>
                            </v-tooltip>
                            <v-tooltip text="Edit schedule">
                                <template #activator="{ props }">
                                    <v-btn v-bind="props" icon="mdi-pencil-outline" size="small" color="primary"
                                        variant="tonal" aria-label="Edit schedule" @click="openEdit(item)" />
                                </template>
                            </v-tooltip>
                            <v-menu location="bottom end">
                                <template #activator="{ props }">
                                    <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text"
                                        aria-label="More schedule actions" />
                                </template>
                                <v-list density="compact">
                                    <v-list-item v-for="status in editableStatusOptions" :key="status"
                                        @click="setQuickStatus(item, status)">
                                        <v-list-item-title>{{ status }}</v-list-item-title>
                                    </v-list-item>
                                    <v-divider />
                                    <v-list-item class="text-error" @click="openDelete(item)">
                                        <v-list-item-title>Delete</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </div>
                    </td>
                </tr>
                <tr v-if="filteredSchedules.length === 0">
                    <td colspan="7" class="text-center py-6 text-medium-emphasis">No doctor schedule found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="820">
        <v-card rounded="lg">
            <v-card-title>{{ editingId ? 'Edit Doctor Schedule' : 'Add Doctor Schedule' }}</v-card-title>
            <v-card-subtitle>Manage doctor practice time, room, quota, and availability status.</v-card-subtitle>
            <v-card-text>
                <v-alert v-if="formError" color="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.doctorName" label="Doctor Name" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.specialty" label="Specialty" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.department" label="Department" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.room" label="Room" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-select v-model="form.day" :items="formDayOptions" label="Day" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="form.startTime" label="Start Time" type="time" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model="form.endTime" label="End Time" type="time" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model.number="form.quota" label="Quota" type="number" min="1" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field v-model.number="form.booked" label="Booked" type="number" min="0" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-select v-model="form.status" :items="editableStatusOptions" label="Status" variant="outlined" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save-outline" @click="saveSchedule">
                    {{ editingId ? 'Save Changes' : 'Save Schedule' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="620">
        <v-card v-if="selectedSchedule" rounded="lg">
            <v-card-title class="text-h5">Schedule Detail</v-card-title>
            <v-divider />
            <v-card-text class="d-flex flex-column ga-3">
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Doctor</span>
                    <span class="font-weight-medium">{{ selectedSchedule.doctorName }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Department</span>
                    <span>{{ selectedSchedule.department }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Specialty</span>
                    <span>{{ selectedSchedule.specialty }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Practice</span>
                    <span>{{ selectedSchedule.day }}, {{ selectedSchedule.startTime }} - {{ selectedSchedule.endTime }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Room</span>
                    <span>{{ selectedSchedule.room }}</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Quota</span>
                    <span>{{ selectedSchedule.booked }} booked from {{ selectedSchedule.quota }} | {{ remainingSlots(selectedSchedule) }} left</span>
                </div>
                <div class="d-flex justify-space-between ga-4">
                    <span class="text-medium-emphasis">Status</span>
                    <v-chip size="small" variant="tonal" :color="statusColor(selectedSchedule.status)">
                        {{ selectedSchedule.status }}
                    </v-chip>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end px-6 pb-4">
                <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
                <v-btn color="primary" variant="flat" @click="openEdit(selectedSchedule); detailDialog = false">Edit</v-btn>
                <v-btn color="secondary" variant="tonal" to="/receptionist/appointments">Create Appointment</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
        <v-card rounded="lg">
            <v-card-title>Delete Doctor Schedule</v-card-title>
            <v-card-text>
                Are you sure you want to delete
                <span class="font-weight-medium">{{ deleteTarget?.doctorName }}</span>
                on {{ deleteTarget?.day }}?
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
                <v-spacer />
                <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" variant="flat" @click="deleteSchedule">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success">
        {{ snackbarMessage }}
    </v-snackbar>
</template>
