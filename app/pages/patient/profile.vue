<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'My Profile',
    description: 'Patient profile page',
})

type PatientProfile = {
    fullName: string
    medicalRecordNumber: string
    email: string
    phone: string
    gender: string
    dateOfBirth: string
    bloodType: string
    address: string
    status: 'Active' | 'Inactive'
}

const { data, pending } = await useFetch<{ profile: PatientProfile }>('/api/patient/profile')

const profile = computed<PatientProfile>(() => data.value?.profile ?? {
    fullName: '-',
    medicalRecordNumber: '-',
    email: '-',
    phone: '-',
    gender: '-',
    dateOfBirth: '',
    bloodType: '-',
    address: '-',
    status: 'Inactive'
})

const profileItems = computed(() => [
    { label: 'Full Name', value: profile.value.fullName },
    { label: 'Medical Record Number', value: profile.value.medicalRecordNumber },
    { label: 'Email', value: profile.value.email },
    { label: 'Phone Number', value: profile.value.phone },
    { label: 'Gender', value: profile.value.gender },
    {
        label: 'Date of Birth',
        value: profile.value.dateOfBirth
            ? new Date(profile.value.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            : '-'
    },
    { label: 'Blood Type', value: profile.value.bloodType },
    { label: 'Address', value: profile.value.address },
])
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">My Profile</h2>
            <p class="text-medium-emphasis mb-0">Review your account and patient information in one place.</p>
        </div>
    </div>

    <v-row>
        <v-col cols="12" lg="4">
            <v-card elevation="0" rounded="lg">
                <v-card-text class="text-center py-8">
                    <v-avatar size="88" color="primary" variant="tonal" class="mb-4">
                        <span class="text-h4 font-weight-bold">
                            {{profile.fullName.split(' ').map((name) => name[0]).slice(0, 2).join('')}}
                        </span>
                    </v-avatar>
                    <div class="text-h5">{{ profile.fullName }}</div>
                    <div class="text-body-2 text-medium-emphasis mt-1">{{ profile.email }}</div>
                    <v-chip class="mt-4" :color="profile.status === 'Active' ? 'success' : 'warning'" variant="tonal">
                        {{ profile.status }}
                    </v-chip>

                    <div v-if="pending" class="text-caption text-medium-emphasis mt-4">Loading...</div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" lg="8">
            <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Personal Information">
                <v-row class="px-4 py-2">
                    <v-col v-for="item in profileItems" :key="item.label" cols="12" sm="6">
                        <div class="py-3">
                            <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                            <div class="text-body-1 font-weight-medium mt-1">{{ item.value }}</div>
                        </div>
                    </v-col>
                </v-row>
            </UiTitleCard>
        </v-col>
    </v-row>
</template>
