<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
    permissions: ['stock.view'],
})

await navigateTo('/pharmacy/stock', { replace: true })
</script>
