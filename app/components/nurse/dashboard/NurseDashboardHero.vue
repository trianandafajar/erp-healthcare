<script setup lang="ts">
</script>

<template>
    <v-card-text class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div>
                <div class="text-caption text-medium-emphasis text-uppercase">Nurse Dashboard</div>
                <h3 class="text-h4 mb-2">Daily care workflow</h3>
                <p class="text-body-1 text-medium-emphasis mb-0">
                    Focus on patients, vital signs, care notes, procedure schedules, and monitoring.
                </p>
            </div>
            <div class="d-flex ga-3 flex-wrap">
                <v-btn color="primary" variant="flat" to="/nurse/vitals">Add Vitals</v-btn>
                <v-btn color="secondary" variant="tonal" to="/nurse/care-notes">Add Note</v-btn>
            </div>
        </div>
    </v-card-text>
</template>
