<script setup lang="ts">
import CallBookingsCalendar from '~/components/dashboard/superadmin/CallBookingsCalendar.vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Call Bookings',
  ogTitle: 'Call Bookings',
  description: 'View and manage demo call requests from the landing page.',
  ogDescription: 'View and manage demo call requests from the landing page.',
})

const { data, pending, refresh } = useLazyFetch<CallBooking[]>('/api/superadmin/call-bookings')

type CallBooking = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  booking_date: string
  booking_time: string
  status: string
  created_at: string
}
</script>

<template>
  <div>
    <v-skeleton-loader v-if="pending" type="card, table" />
    <CallBookingsCalendar v-else-if="data" :bookings="data as CallBooking[]" @refresh="refresh()" />
  </div>
</template>
