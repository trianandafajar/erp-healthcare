<script setup lang="ts">
definePageMeta({
    layout: 'pharmacy',
    middleware: ['auth', 'role', 'permission'],
    role: 'pharmacy',
})

await navigateTo('/pharmacy/dashboard', { replace: true })
</script>
