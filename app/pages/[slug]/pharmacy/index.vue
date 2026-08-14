<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['authorize'],
    role: 'pharmacy',
    requiredFeature: 'pharmacy_module',
})

await navigateTo('/pharmacy/dashboard', { replace: true })
</script>
