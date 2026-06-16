<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'role'],
    role: 'nurse',
})

await navigateTo('/nurse/dashboard', { replace: true })
</script>
