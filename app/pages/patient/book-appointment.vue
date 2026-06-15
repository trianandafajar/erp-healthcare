<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'Book Appointment',
    description: 'Patient appointment booking page',
})

const { doctorSchedules } = usePatientPortalMock()

const form = ref({
    department: '',
    doctor: '',
    date: '',
    time: '',
    complaint: '',
})

const snackbar = ref(false)
const doctorSearch = ref('')

const departmentOptions = computed(() => [...new Set(doctorSchedules.map((item) => item.department))])
const doctorOptions = computed(() =>
    doctorSchedules.filter((item) => !form.value.department || item.department === form.value.department)
)
const filteredDoctorOptions = computed(() =>
    doctorOptions.value.filter((item) => {
        const keyword = doctorSearch.value.toLowerCase()
        return (
            item.doctor.toLowerCase().includes(keyword) ||
            item.specialty.toLowerCase().includes(keyword) ||
            item.day.toLowerCase().includes(keyword)
        )
    })
)

watch(() => form.value.department, () => {
    form.value.doctor = ''
    form.value.time = ''
})

watch(() => form.value.doctor, (doctorName) => {
    const selectedDoctor = doctorSchedules.find((item) => item.doctor === doctorName)
    form.value.time = selectedDoctor?.time ?? ''
})

function submitBooking() {
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Book Appointment</h2>
            <p class="text-medium-emphasis mb-0">Choose a department, doctor, and preferred schedule for your next visit.</p>
        </div>
    </div>

    <v-row>
        <v-col cols="12" lg="8">
            <UiTitleCard class-name="px-4 pb-4 rounded-md" title="Appointment Form">
                <v-row>
                    <v-col cols="12" md="6">
                        <v-select v-model="form.department" :items="departmentOptions" label="Department" variant="outlined"
                            hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select v-model="form.doctor" :items="doctorOptions.map((item) => item.doctor)" label="Doctor"
                            variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.date" label="Preferred Date" type="date" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.time" label="Practice Time" variant="outlined" readonly hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.complaint" label="Complaint or Notes" variant="outlined" rows="4"
                            hide-details />
                    </v-col>
                </v-row>

                <div class="d-flex justify-end mt-6">
                    <v-btn color="primary" prepend-icon="mdi-calendar-check-outline" @click="submitBooking">
                        Confirm Booking
                    </v-btn>
                </div>
            </UiTitleCard>
        </v-col>

        <v-col cols="12" lg="4">
            <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Available Doctors">
                <div class="px-4 pt-3">
                    <v-text-field v-model="doctorSearch" placeholder="Search available doctors"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable />
                </div>
                <div class="px-4 py-4 d-flex flex-column ga-3">
                    <v-card v-for="item in filteredDoctorOptions" :key="item.id" elevation="0" border rounded="lg">
                        <v-card-text>
                            <div class="text-body-1 font-weight-medium">{{ item.doctor }}</div>
                            <div class="text-body-2 text-medium-emphasis">{{ item.specialty }}</div>
                            <div class="text-caption mt-2">{{ item.day }} | {{ item.time }}</div>
                        </v-card-text>
                    </v-card>
                    <div v-if="filteredDoctorOptions.length === 0" class="py-6 text-center text-medium-emphasis">
                        No available doctor found.
                    </div>
                </div>
            </UiTitleCard>
        </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="success">
        Appointment booking request has been prepared.
    </v-snackbar>
</template>
