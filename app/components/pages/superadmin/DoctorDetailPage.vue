<script setup lang="ts">
const props = defineProps<{
  tenantSlug?: string
}>()

const route = useRoute()
const entityId = route.query.entityId as string

const { data, pending } = await useFetch(`/api/doctors/${entityId}`, {
  key: `superadmin-doctor-${entityId}`,
})

const { data: appointmentsData, pending: apptPending } = await useFetch(`/api/doctors/${entityId}/appointments`, {
  key: `superadmin-doctor-${entityId}-appointments`,
  query: { limit: 50 },
})

const { data: patientsData, pending: patientPending } = await useFetch(`/api/doctors/${entityId}/patients`, {
  key: `superadmin-doctor-${entityId}-patients`,
  query: { limit: 50 },
})

const doctor = computed(() => data.value)
const profile = computed(() => doctor.value?.profiles)
const department = computed(() => doctor.value?.departments)
const stats = computed(() => doctor.value?.stats)
const schedules = computed(() => doctor.value?.active_schedules ?? [])
const appointments = computed(() => appointmentsData.value?.data ?? [])
const patients = computed(() => patientsData.value?.data ?? [])

const activeTab = ref('info')

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(amount?: number | null) {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

function formatTime(timeStr?: string | null) {
  if (!timeStr) return '-'
  return timeStr.slice(0, 5)
}

function genderColor(gender?: string | null) {
  if (gender === 'male') return 'info'
  if (gender === 'female') return 'pink'
  return 'secondary'
}

function calcAge(dob?: string | null) {
  if (!dob) return '-'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' yo'
}

function appointmentStatusColor(status: string) {
  const map: Record<string, string> = { pending: 'warning', in_progress: 'info', completed: 'success', cancelled: 'error' }
  return map[status] ?? 'default'
}
</script>

<template>
  <div v-if="pending" class="d-flex justify-center py-12">
    <v-progress-circular indeterminate color="primary" />
  </div>

  <div v-else-if="!doctor" class="text-center py-12 text-medium-emphasis">
    Doctor not found
  </div>

  <template v-else>
    <!-- Header -->
    <v-card variant="flat" class="mb-4">
      <v-card-item class="pa-5">
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div class="d-flex align-center ga-4">
            <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo({ query: { section: 'doctors' } })" />
            <v-avatar size="56" color="primary" variant="tonal">
              <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
              <span v-else class="text-h6 font-weight-bold">{{ getInitials(profile?.full_name) }}</span>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ profile?.full_name ?? '-' }}</div>
              <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                <v-chip v-if="doctor.specialization" size="small" color="primary" variant="tonal" label>
                  {{ doctor.specialization }}
                </v-chip>
                <v-chip v-if="department" size="small" color="secondary" variant="tonal" label>
                  <v-icon start icon="mdi-hospital-building" size="14" />
                  {{ department.name }}
                </v-chip>
                <v-chip :color="doctor.is_available ? 'success' : 'error'" size="small" variant="tonal" label>
                  {{ doctor.is_available ? 'Available' : 'Unavailable' }}
                </v-chip>
              </div>
            </div>
          </div>

        </div>
      </v-card-item>
    </v-card>

    <!-- Summary cards -->
    <v-row class="mb-4">
      <v-col cols="6" sm="4" md="2" v-for="s in [
        { label: 'Total Patients', value: stats?.total_patients, icon: 'mdi-account-group', color: 'primary' },
        { label: 'Appointments', value: stats?.total_appointments, icon: 'mdi-calendar-check', color: 'info' },
        { label: 'Today', value: stats?.appointments_today, icon: 'mdi-calendar-today', color: 'warning' },
        { label: 'Completed', value: stats?.completed, icon: 'mdi-check-circle', color: 'success' },
        { label: 'Medical Records', value: stats?.total_medical_records, icon: 'mdi-file-document', color: 'secondary' },
        { label: 'Prescriptions', value: stats?.total_prescriptions, icon: 'mdi-pill', color: 'error' },
      ]" :key="s.label">
        <v-card variant="flat" height="100%">
          <v-card-text class="d-flex align-center ga-3 pa-4">
            <v-avatar :color="s.color" variant="tonal" size="40">
              <v-icon :icon="s.icon" size="20" />
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
              <div class="text-h6 font-weight-bold">{{ s.value ?? 0 }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-card variant="flat">
      <v-tabs v-model="activeTab" color="primary" density="comfortable">
        <v-tab value="info" prepend-icon="mdi-account">Info</v-tab>
        <v-tab value="schedules" prepend-icon="mdi-calendar-clock">
          Schedules
          <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">{{ schedules.length }}</v-chip>
        </v-tab>
        <v-tab value="appointments" prepend-icon="mdi-calendar">
          Appointments
          <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">{{ stats?.total_appointments ?? 0 }}</v-chip>
        </v-tab>
        <v-tab value="patients" prepend-icon="mdi-account-group">
          Patients
          <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">{{ stats?.total_patients ?? 0 }}</v-chip>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- INFO -->
        <v-window-item value="info">
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="h-100">
                  <v-card-item class="py-4">
                    <template #prepend>
                      <v-avatar color="primary" variant="tonal" size="42">
                        <v-icon icon="mdi-stethoscope" />
                      </v-avatar>
                    </template>
                    <div>
                      <div class="text-h6 font-weight-bold">Professional Information</div>
                      <div class="text-caption text-medium-emphasis">Medical credentials and practice details</div>
                    </div>
                  </v-card-item>
                  <v-divider />
                  <v-card-text class="pa-6">
                    <v-row>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">Specialization</div>
                        <div class="text-body-1 font-weight-bold">{{ doctor.specialization || '-' }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">Department</div>
                        <div class="text-body-1 font-weight-bold">{{ department?.name || '-' }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">Experience</div>
                        <div class="text-body-1">{{ doctor.experience_years || 0 }} Years</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">Consultation Fee</div>
                        <div class="text-h6 font-weight-bold text-primary">{{ formatCurrency(doctor.consultation_fee) }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">STR Number</div>
                        <div class="text-body-2">{{ doctor.str_number || '-' }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">SIP Number</div>
                        <div class="text-body-2">{{ doctor.sip_number || '-' }}</div>
                      </v-col>
                      <v-col cols="12">
                        <div class="text-overline text-medium-emphasis">Phone Number</div>
                        <div class="text-body-2">{{ doctor.phone || '-' }}</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="h-100">
                  <v-card-item class="py-4">
                    <template #prepend>
                      <v-avatar color="secondary" variant="tonal" size="42">
                        <v-icon icon="mdi-account-circle-outline" />
                      </v-avatar>
                    </template>
                    <div>
                      <div class="text-h6 font-weight-bold">Account Information</div>
                      <div class="text-caption text-medium-emphasis">User profile and account details</div>
                    </div>
                  </v-card-item>
                  <v-divider />
                  <v-card-text class="pa-6">
                    <v-row>
                      <v-col cols="12">
                        <div class="text-overline text-medium-emphasis">Full Name</div>
                        <div class="text-body-1 font-weight-bold">{{ profile?.full_name || '-' }}</div>
                      </v-col>
                      <v-col cols="12">
                        <div class="text-overline text-medium-emphasis">Email Address</div>
                        <div class="text-body-2">{{ profile?.email || '-' }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis mb-2">Account Status</div>
                        <v-chip :color="profile?.status === 'active' ? 'success' : 'warning'" variant="tonal" size="small">
                          {{ profile?.status || '-' }}
                        </v-chip>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-overline text-medium-emphasis">Joined</div>
                        <div class="text-body-2">{{ formatDate(doctor.created_at) }}</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" v-if="doctor.biography">
                <v-card variant="outlined" rounded="lg">
                  <v-card-item class="py-4">
                    <template #prepend>
                      <v-avatar color="info" variant="tonal" size="42">
                        <v-icon icon="mdi-text-box-outline" />
                      </v-avatar>
                    </template>
                    <div>
                      <div class="text-h6 font-weight-bold">Biography</div>
                      <div class="text-caption text-medium-emphasis">Doctor profile and background</div>
                    </div>
                  </v-card-item>
                  <v-divider />
                  <v-card-text class="text-body-1 text-medium-emphasis" style="line-height: 1.9; white-space: pre-line">
                    {{ doctor.biography }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- SCHEDULES -->
        <v-window-item value="schedules">
          <v-card-text class="pa-6">
            <div v-if="!schedules.length" class="text-center py-8 text-medium-emphasis">
              <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
              No active schedules
            </div>
            <v-row v-else>
              <v-col v-for="schedule in schedules" :key="schedule.id" cols="12" sm="6" md="4">
                <v-card variant="outlined" rounded="md">
                  <v-card-item>
                    <template #prepend>
                      <v-avatar color="primary" variant="tonal" size="36">
                        <v-icon icon="mdi-calendar-week" size="20" />
                      </v-avatar>
                    </template>
                    <v-card-title class="text-body-1 font-weight-bold">{{ DAY_NAMES[schedule.day_of_week] }}</v-card-title>
                  </v-card-item>
                  <v-divider />
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-clock-outline"
                      :title="`${formatTime(schedule.start_time)} – ${formatTime(schedule.end_time)}`" />
                    <v-list-item v-if="schedule.max_patients" prepend-icon="mdi-account-multiple"
                      :title="`Max ${schedule.max_patients} patients`" />
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- APPOINTMENTS -->
        <v-window-item value="appointments">
          <div v-if="apptPending" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>
          <v-table v-else hover density="comfortable">
            <thead class="bg-containerBg">
              <tr>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Time</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Department</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Complaint</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!appointments.length">
                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                  <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                  No appointments found
                </td>
              </tr>
              <tr v-for="appt in appointments" :key="appt.id">
                <td class="py-3 text-body-2">{{ formatDate(appt.appointment_date) }}</td>
                <td class="py-3 text-body-2">{{ formatTime(appt.appointment_time) }}</td>
                <td class="py-3 text-body-2">
                  <div class="font-weight-medium">{{ appt.patients?.full_name ?? '-' }}</div>
                  <div v-if="appt.patients?.medical_record_number" class="text-caption text-medium-emphasis">{{ appt.patients.medical_record_number }}</div>
                </td>
                <td class="py-3">
                  <v-chip v-if="appt.departments" size="small" variant="tonal" color="secondary" label>{{ appt.departments.name }}</v-chip>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td class="py-3">
                  <v-chip size="small" variant="tonal" color="secondary" label>{{ appt.type }}</v-chip>
                </td>
                <td class="py-3">
                  <v-chip :color="appointmentStatusColor(appt.status)" size="small" variant="tonal">{{ appt.status }}</v-chip>
                </td>
                <td class="py-3 text-body-2 text-medium-emphasis">{{ appt.chief_complaint ?? '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- PATIENTS -->
        <v-window-item value="patients">
          <div v-if="patientPending" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>
          <v-table v-else hover density="comfortable">
            <thead class="bg-containerBg">
              <tr>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">MRN</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Gender</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date of Birth</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Age</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Blood Type</th>
                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Phone</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!patients.length">
                <td colspan="7" class="text-center py-8 text-medium-emphasis">
                  <v-icon icon="mdi-account-group" size="32" class="mb-2 d-block mx-auto" />
                  No patients found
                </td>
              </tr>
              <tr v-for="patient in patients" :key="patient.id">
                <td class="py-3">
                  <div class="d-flex align-center ga-3">
                    <v-avatar size="32" color="primary" variant="tonal">
                      <span class="text-caption font-weight-bold">{{ getInitials(patient.full_name) }}</span>
                    </v-avatar>
                    <span class="text-body-2 font-weight-medium">{{ patient.full_name }}</span>
                  </div>
                </td>
                <td class="py-3">
                  <v-chip v-if="patient.medical_record_number" size="small" color="primary" variant="tonal" label>
                    {{ patient.medical_record_number }}
                  </v-chip>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td class="py-3">
                  <v-chip v-if="patient.gender" :color="genderColor(patient.gender)" size="small" variant="tonal" label>{{ patient.gender }}</v-chip>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td class="py-3 text-body-2">{{ formatDate(patient.date_of_birth) }}</td>
                <td class="py-3 text-body-2">{{ calcAge(patient.date_of_birth) }}</td>
                <td class="py-3">
                  <v-chip v-if="patient.blood_type" size="small" color="error" variant="tonal" label>{{ patient.blood_type }}</v-chip>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td class="py-3 text-body-2 text-medium-emphasis">{{ patient.phone ?? '-' }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>
      </v-window>
    </v-card>
  </template>
</template>
