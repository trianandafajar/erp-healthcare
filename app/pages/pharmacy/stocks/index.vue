<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role'],
    role: 'pharmacy',
})

await navigateTo('/pharmacy/stock', { replace: true })
</script>
