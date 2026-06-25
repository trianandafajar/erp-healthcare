<script setup lang="ts">
import { ref } from 'vue'

interface CreatedPatientUser {
    id: string
    full_name: string
    email: string
    medical_record_number?: string
}

type EmitSubmit = (payload: CreatedPatientUser | null) => void

const props = defineProps<{
    modelValue: boolean
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'created', payload: CreatedPatientUser | null): void
    (e: 'cancel'): void
}>()

const form = ref({
    full_name: '',
    email: '',
})

const creating = ref(false)

function close() {
    emit('update:modelValue', false)
    emit('cancel')
}

async function submit() {
    if (!form.value.full_name || !form.value.email) return
    creating.value = true
    try {
        const res: any = await $fetch('/api/users', {
            method: 'POST',
            body: {
                full_name: form.value.full_name,
                email: form.value.email,
                password: 'Password123',
                role: 'patient',
            },
        })

        const newUser = res?.user
            ? {
                id: res.user.id,
                full_name: res.user?.user_metadata?.full_name ?? form.value.full_name,
                email: res.user?.email ?? form.value.email,
            }
            : {
                id: res?.id,
                full_name: form.value.full_name,
                email: form.value.email,
            }

        emit('created', newUser)
        emit('update:modelValue', false)
        form.value = { full_name: '', email: '' }
    } catch (err: any) {
        emit('created', null)
    } finally {
        creating.value = false
    }
}
</script>

<template>
    <v-dialog :model-value="props.modelValue" max-width="520" persistent
        @update:model-value="(v) => emit('update:modelValue', v)">
        <v-card rounded="lg" width="100%">
            <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
                <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-account-plus-outline" size="20" />
                    <span class="text-h6 font-weight-bold">Create Patient Account</span>
                </div>
                <v-btn icon="mdi-close" variant="text" density="compact" :disabled="creating" @click="close" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                        <v-text-field v-model="form.full_name" placeholder="Patient Name" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Email Address</v-label>
                        <v-text-field v-model="form.email" placeholder="patient@hospital.com" type="email"
                            variant="outlined" density="compact" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 pt-3">
                <v-spacer />
                <v-btn variant="tonal" color="secondary" :disabled="creating" @click="close">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" :loading="creating"
                    :disabled="!form.full_name || !form.email || creating" @click="submit">
                    Create Account
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
