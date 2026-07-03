<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'role', 'permission'],
    role: 'nurse',
})

await navigateTo('/nurse/dashboard', { replace: true })
</script>
