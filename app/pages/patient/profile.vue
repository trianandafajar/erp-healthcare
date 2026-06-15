<script setup lang="ts">
definePageMeta({
    layout: 'patient',
    middleware: 'auth'
})

useSeoMeta({
    title: 'My Profile',
    description: 'Patient profile page',
})

const { profile } = usePatientPortalMock()
const search = ref('')

const profileItems = [
    { label: 'Full Name', value: profile.fullName },
    { label: 'Medical Record Number', value: profile.medicalRecordNumber },
    { label: 'Email', value: profile.email },
    { label: 'Phone Number', value: profile.phone },
    { label: 'Gender', value: profile.gender },
    { label: 'Date of Birth', value: new Date(profile.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { label: 'Blood Type', value: profile.bloodType },
    { label: 'Address', value: profile.address },
]

const filteredProfileItems = computed(() =>
    profileItems.filter((item) => {
        const keyword = search.value.toLowerCase()
        return item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword)
    })
)
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 flex-wrap ga-3">
        <div>
            <h2 class="text-h3 mb-1">My Profile</h2>
            <p class="text-medium-emphasis mb-0">Review your account and patient information in one place.</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-account-edit-outline">
            Edit Profile
        </v-btn>
    </div>

    <v-row>
        <v-col cols="12" lg="4">
            <v-card elevation="0" rounded="lg">
                <v-card-text class="text-center py-8">
                    <v-avatar size="88" color="primary" variant="tonal" class="mb-4">
                        <span class="text-h4 font-weight-bold">{{ profile.fullName.split(' ').map((name) => name[0]).slice(0, 2).join('') }}</span>
                    </v-avatar>
                    <div class="text-h5">{{ profile.fullName }}</div>
                    <div class="text-body-2 text-medium-emphasis mt-1">{{ profile.email }}</div>
                    <v-chip class="mt-4" color="success" variant="tonal">{{ profile.status }}</v-chip>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" lg="8">
            <UiTitleCard class-name="px-0 pb-0 rounded-md" title="Personal Information">
                <div class="px-4 pt-3">
                    <v-text-field v-model="search" placeholder="Search profile information"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                        style="max-width: 340px" />
                </div>
                <v-row class="px-4 py-2">
                    <v-col v-for="item in filteredProfileItems" :key="item.label" cols="12" sm="6">
                        <div class="py-3">
                            <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                            <div class="text-body-1 font-weight-medium mt-1">{{ item.value }}</div>
                        </div>
                    </v-col>
                    <v-col v-if="filteredProfileItems.length === 0" cols="12">
                        <div class="py-8 text-center text-medium-emphasis">No profile information found.</div>
                    </v-col>
                </v-row>
            </UiTitleCard>
        </v-col>
    </v-row>
</template>
