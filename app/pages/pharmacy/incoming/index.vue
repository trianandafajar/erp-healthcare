<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
    permissions: ['stock-in.view'],
})

await navigateTo('/pharmacy/stock-in', { replace: true })
</script>
