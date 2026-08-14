<script setup lang="ts">
definePageMeta({
    middleware: ['authorize'],
    role: 'nurse',
    requiredFeature: 'nurse_module',
})

await navigateTo('/nurse/dashboard', { replace: true })
</script>
