<script setup lang="ts">
const workspace = useReceptionistWorkspace()
const search = ref('')
const snackbar = ref(false)
const dialog = ref(false)

const form = reactive({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female',
    dateOfBirth: '',
    phone: '',
    address: '',
    insuranceProvider: 'Self Pay',
    emergencyContact: '',
})

const filteredPatients = computed(() => {
    const keyword = search.value.toLowerCase()
    return workspace.patients.value.filter((item) =>
        item.fullName.toLowerCase().includes(keyword) ||
        item.medicalRecordNumber.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword)
    )
})

function submitRegistration() {
    if (!form.fullName || !form.phone || !form.dateOfBirth) return

    workspace.registerPatient({
        fullName: form.fullName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone,
        address: form.address,
        insuranceProvider: form.insuranceProvider,
        emergencyContact: form.emergencyContact,
    })

    form.fullName = ''
    form.gender = 'Male'
    form.dateOfBirth = ''
    form.phone = ''
    form.address = ''
    form.insuranceProvider = 'Self Pay'
    form.emergencyContact = ''
    dialog.value = false
    snackbar.value = true
}
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">Patient Registration</h2>
            <p class="text-medium-emphasis mb-0">Register new patients and check existing patient records.</p>
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-account-plus-outline" @click="dialog = true">
            Patient Registration
        </v-btn>
    </div>

    <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Patient Data">
        <div class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-3">
            <v-text-field
                v-model="search"
                placeholder="Search patient, MRN, or phone number"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="max-width: 420px"
            />
            <div class="text-caption text-medium-emphasis">
                Showing {{ filteredPatients.length }} of {{ workspace.patients.value.length }} patients
            </div>
        </div>
        <v-table class="text-no-wrap">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Date of Birth</th>
                    <th>Contact</th>
                    <th>Insurance</th>
                    <th>Emergency</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredPatients" :key="item.id">
                    <td>
                        <div class="font-weight-medium">{{ item.fullName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.medicalRecordNumber }} - {{ item.gender }}</div>
                    </td>
                    <td>{{ new Date(item.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                    <td>
                        <div>{{ item.phone }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.address }}</div>
                    </td>
                    <td>{{ item.insuranceProvider }}</td>
                    <td>{{ item.emergencyContact }}</td>
                </tr>
                <tr v-if="filteredPatients.length === 0">
                    <td colspan="5" class="text-center py-6 text-medium-emphasis">No patient found.</td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>

    <v-dialog v-model="dialog" max-width="760">
        <v-card>
            <v-card-title class="text-h5">Patient Registration</v-card-title>
            <v-divider />
            <v-form @submit.prevent="submitRegistration">
                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="form.fullName" label="Full Name" variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-select v-model="form.gender" :items="['Male', 'Female']" label="Gender" variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.dateOfBirth" label="Date of Birth" type="date" variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.phone" label="Phone Number" variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.insuranceProvider" label="Insurance" variant="outlined" density="compact" hide-details />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea v-model="form.address" label="Address" variant="outlined" density="compact" rows="3" hide-details />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="form.emergencyContact" label="Emergency Contact" variant="outlined" density="compact" hide-details />
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                    <v-btn color="primary" variant="flat" type="submit">Save Patient</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="2500">Patient added successfully.</v-snackbar>
</template>
