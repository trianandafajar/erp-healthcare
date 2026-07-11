<script setup lang="ts">
const upgrade = useUpgradeStore()
const { plan, currentPlanFeatures } = usePlan()

const planName = computed(() => {
    const p = plan.value
    return p.charAt(0).toUpperCase() + p.slice(1)
})
</script>

<template>
    <v-dialog v-model="upgrade.shown" max-width="480" persistent>
        <v-card rounded="xl" class="pa-2">
            <v-card-text class="text-center pa-6 pb-2">
                <v-avatar color="amber-lighten-4" size="72" class="mb-4">
                    <v-icon icon="mdi-lock-outline" size="32" color="amber-darken-2" />
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-2">Upgrade Required</h2>

                <p class="text-body-2 text-medium-emphasis mb-2">
                    Your current <strong>{{ planName }}</strong> plan
                    does not include
                    <strong>{{ upgrade.label }}</strong>.
                </p>

                <p class="text-caption text-medium-emphasis mb-4">
                    Upgrade to unlock this feature and more.
                </p>

                <v-divider class="mb-4" />

                <div class="text-left">
                    <p class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                        {{ planName }} Plan Features
                    </p>
                    <div v-if="currentPlanFeatures.length" class="d-flex flex-column ga-1">
                        <div v-for="f in currentPlanFeatures" :key="f.feature_key" class="d-flex align-center ga-2">
                            <v-icon icon="mdi-check-circle" size="18" color="green-darken-1" />
                            <span class="text-body-3 text-medium-emphasis">{{ f.feature_label }}</span>
                        </div>
                    </div>
                    <p v-else class="text-caption text-medium-emphasis">
                        Loading features...
                    </p>
                </div>
            </v-card-text>

            <v-card-actions class="justify-center pb-6 px-6 pt-2">
                <v-btn variant="tonal" color="secondary" class="mr-2" @click="upgrade.dismiss()">
                    Close
                </v-btn>
                <NuxtLink to="/onboarding/subscription" target="_blank" rel="noopener noreferrer"
                    class="text-decoration-none">
                    <v-btn variant="flat" color="primary">
                        View Pricing Plans
                    </v-btn>
                </NuxtLink>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>