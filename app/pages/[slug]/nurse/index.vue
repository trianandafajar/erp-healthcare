<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'role', 'permission', 'plan'],
    role: 'nurse',
    requiredFeature: 'nurse_module',
})

await navigateTo('/nurse/dashboard', { replace: true })
</script>
