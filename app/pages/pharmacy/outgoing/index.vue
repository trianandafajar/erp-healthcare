<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
    permissions: ['stock-out.view'],
})

await navigateTo('/pharmacy/stock-out', { replace: true })
</script>
