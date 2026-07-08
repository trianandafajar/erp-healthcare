<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission', 'plan'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
})

await navigateTo('/pharmacy/dashboard', { replace: true })
</script>
