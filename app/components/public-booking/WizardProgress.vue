<script setup lang="ts">
interface StepItem {
    label: string
}

const props = defineProps<{
    steps: StepItem[]
    current: number
}>()

function circleStyle(index: number): Record<string, string> {
    const completed = index < props.current - 1
    const active = index === props.current - 1
    if (active) {
        return {
            width: '34px',
            height: '34px',
            backgroundColor: 'rgb(var(--v-theme-primary))',
            color: '#fff',
            boxShadow: '0 0 0 4px rgba(var(--v-theme-primary), 0.18)',
        }
    }
    if (completed) {
        return {
            width: '32px',
            height: '32px',
            backgroundColor: 'rgb(var(--v-theme-primary))',
            color: '#fff',
        }
    }
    return {
        width: '32px',
        height: '32px',
        backgroundColor: '#eceff1',
        color: 'rgba(0, 0, 0, 0.55)',
    }
}
</script>

<template>
    <div class="d-flex align-center">
        <template v-for="(step, i) in steps" :key="i">
            <div class="d-flex flex-column align-center" style="min-width: 84px;">
                <div class="d-flex align-center justify-center rounded-circle" :style="circleStyle(i)">
                    <v-icon v-if="i < current - 1" icon="mdi-check" size="18" color="white" />
                    <span v-else class="text-body-2 font-weight-bold" :style="{ color: circleStyle(i).color }">
                        {{ i + 1 }}
                    </span>
                </div>
                <div
                    class="text-caption font-weight-medium mt-2 text-center"
                    :class="i === current - 1 ? 'text-primary' : i < current - 1 ? '' : 'text-medium-emphasis'"
                >
                    {{ step.label }}
                </div>
            </div>
            <div
                v-if="i < steps.length - 1"
                class="mx-2"
                style="height: 2px; border-radius: 2px; flex: 1 1 0;"
                :style="{ backgroundColor: i < current - 1 ? 'rgb(var(--v-theme-primary))' : '#e0e0e0' }"
            ></div>
        </template>
    </div>
</template>
