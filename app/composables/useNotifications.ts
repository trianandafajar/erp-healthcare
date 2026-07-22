type NotificationLevel = 'info' | 'success' | 'warning' | 'critical'

export type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, any> | null
  is_read: boolean
  created_at: string
}

export type NotificationViewItem = NotificationRow & {
  level: NotificationLevel
  icon: string
  color: string
  audienceRoles: string[]
  relativeTime: string
  shortTime: string
  summary: string
  targetRoute: string | null
}

type NotificationCatalogEntry = {
  level: NotificationLevel
  icon: string
  color: string
  audienceRoles: string[]
  routes: Partial<Record<string, string>>
}

const NOTIFICATION_CATALOG: Record<string, NotificationCatalogEntry> = {
  patient_created: {
    level: 'success',
    icon: 'mdi-account-plus',
    color: 'success',
    audienceRoles: ['doctor', 'specialist', 'admin', 'receptionist'],
    routes: {
      doctor: '/doctor/patients/today',
      specialist: '/doctor/patients/today',
      receptionist: '/receptionist/patients/register',
      admin: '/patients',
    },
  },
  vital_recorded: {
    level: 'success',
    icon: 'mdi-heart-plus-outline',
    color: 'success',
    audienceRoles: ['nurse'],
    routes: {
      nurse: '/nurse/vitals',
    },
  },
  schedule_created: {
    level: 'info',
    icon: 'mdi-calendar-plus',
    color: 'info',
    audienceRoles: ['doctor', 'receptionist', 'admin'],
    routes: {
      doctor: '/doctor/schedule',
      receptionist: '/receptionist/doctor-schedules',
    },
  },
  schedule_updated: {
    level: 'warning',
    icon: 'mdi-calendar-edit',
    color: 'warning',
    audienceRoles: ['doctor', 'receptionist', 'admin'],
    routes: {
      doctor: '/doctor/schedule',
      receptionist: '/receptionist/doctor-schedules',
    },
  },
  schedule_deleted: {
    level: 'critical',
    icon: 'mdi-calendar-remove',
    color: 'error',
    audienceRoles: ['doctor', 'receptionist', 'admin'],
    routes: {
      doctor: '/doctor/schedule',
      receptionist: '/receptionist/doctor-schedules',
    },
  },
  patient_critical: {
    level: 'critical',
    icon: 'mdi-heart-pulse',
    color: 'error',
    audienceRoles: ['nurse', 'doctor', 'specialist', 'admin'],
    routes: {
      nurse: '/nurse/monitoring',
      doctor: '/doctor/patients/today',
      specialist: '/doctor/patients/today',
    },
  },
  appointment_new: {
    level: 'info',
    icon: 'mdi-calendar-plus',
    color: 'info',
    audienceRoles: ['doctor', 'specialist', 'admin', 'receptionist'],
    routes: {
      doctor: '/doctor/patients/today',
      specialist: '/doctor/patients/today',
      receptionist: '/receptionist/appointments',
    },
  },
  appointment_confirmed: {
    level: 'success',
    icon: 'mdi-calendar-check',
    color: 'success',
    audienceRoles: ['patient', 'admin'],
    routes: {
      patient: '/patient/dashboard',
    },
  },
  appointment_cancelled: {
    level: 'warning',
    icon: 'mdi-calendar-remove',
    color: 'warning',
    audienceRoles: ['patient', 'doctor', 'specialist', 'admin'],
    routes: {
      patient: '/patient/dashboard',
      doctor: '/doctor/patients/today',
      specialist: '/doctor/patients/today',
    },
  },
  queue_assigned: {
    level: 'info',
    icon: 'mdi-ticket-confirmation',
    color: 'info',
    audienceRoles: ['patient', 'receptionist', 'admin'],
    routes: {
      patient: '/patient/dashboard',
      receptionist: '/receptionist/queue',
    },
  },
  prescription_new: {
    level: 'warning',
    icon: 'mdi-pill',
    color: 'warning',
    audienceRoles: ['pharmacy', 'admin'],
    routes: {
      pharmacy: '/pharmacy/prescriptions',
    },
  },
  prescription_verified: {
    level: 'success',
    icon: 'mdi-check-decagram',
    color: 'success',
    audienceRoles: ['patient', 'pharmacy', 'admin'],
    routes: {
      patient: '/patient/prescriptions',
      pharmacy: '/pharmacy/verification',
    },
  },
  prescription_ready: {
    level: 'success',
    icon: 'mdi-bag-personal',
    color: 'success',
    audienceRoles: ['patient', 'pharmacy', 'admin'],
    routes: {
      patient: '/patient/prescriptions',
      pharmacy: '/pharmacy/dispensing',
    },
  },
  prescription_rejected: {
    level: 'critical',
    icon: 'mdi-alert-circle',
    color: 'error',
    audienceRoles: ['doctor', 'specialist', 'admin'],
    routes: {
      doctor: '/doctor/medical-records',
      specialist: '/doctor/medical-records',
      pharmacy: '/pharmacy/verification',
    },
  },
  low_stock: {
    level: 'warning',
    icon: 'mdi-capsule',
    color: 'warning',
    audienceRoles: ['pharmacy', 'admin'],
    routes: {
      pharmacy: '/pharmacy/stock',
    },
  },
  medicine_expiring: {
    level: 'warning',
    icon: 'mdi-calendar-alert',
    color: 'warning',
    audienceRoles: ['pharmacy', 'admin'],
    routes: {
      pharmacy: '/pharmacy/stock',
    },
  },
  call_booking: {
    level: 'info',
    icon: 'mdi-phone-outline',
    color: 'info',
    audienceRoles: ['superadmin'],
    routes: {
      superadmin: '/super-admin/call-bookings',
    },
  },
  contact_inquiry: {
    level: 'info',
    icon: 'mdi-email-fast-outline',
    color: 'info',
    audienceRoles: ['superadmin'],
    routes: {
      superadmin: '/super-admin/contact-inquiries',
    },
  },
}

const DEFAULT_NOTIFICATION_CATALOG: NotificationCatalogEntry = {
  level: 'info',
  icon: 'mdi-bell-outline',
  color: 'primary',
  audienceRoles: ['admin'],
  routes: {},
}

let audioContext: AudioContext | null = null
let soundListenersBound = false

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime()
  const diff = createdAt - Date.now()
  const abs = Math.abs(diff)

  const seconds = Math.round(abs / 1000)
  if (seconds < 60) return `${seconds}s ${diff <= 0 ? 'ago' : 'from now'}`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ${diff <= 0 ? 'ago' : 'from now'}`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ${diff <= 0 ? 'ago' : 'from now'}`

  const days = Math.round(hours / 24)
  return `${days}d ${diff <= 0 ? 'ago' : 'from now'}`
}

function formatShortTime(value: string) {
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

  const today = new Date()
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (sameDay) return time

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function toViewItem(notification: NotificationRow, currentRole: string | null, tenantSlug: string | null): NotificationViewItem {
  const catalog = NOTIFICATION_CATALOG[notification.type] ?? DEFAULT_NOTIFICATION_CATALOG
  const dataAudience = notification.data?.audience_role
  const audienceRoles = Array.isArray(dataAudience)
    ? dataAudience.filter(Boolean)
    : typeof dataAudience === 'string'
      ? [dataAudience]
      : catalog.audienceRoles

  const dataLevel = notification.data?.level as NotificationLevel | undefined
  const dataIcon = notification.data?.icon as string | undefined
  const dataColor = notification.data?.color as string | undefined

  return {
    ...notification,
    level: dataLevel ?? catalog.level,
    icon: dataIcon ?? catalog.icon,
    color: dataColor ?? catalog.color,
    audienceRoles,
    relativeTime: formatRelativeTime(notification.created_at),
    shortTime: formatShortTime(notification.created_at),
    summary: notification.body ?? notification.title,
    targetRoute: resolveRoute(notification, catalog, audienceRoles, currentRole, tenantSlug),
  }
}

function addSlugIfNeeded(route: string, tenantSlug: string | null, role: string | null): string {
  if (!tenantSlug) return route
  if (role === 'superadmin') return route
  if (route.startsWith(`/${tenantSlug}/`)) return route
  return `/${tenantSlug}${route}`
}

function resolveRoute(notification: NotificationRow, catalog: NotificationCatalogEntry, audienceRoles: string[], currentRole: string | null, tenantSlug: string | null) {
  const explicitRoute = notification.data?.redirect_to
  if (typeof explicitRoute === 'string' && explicitRoute.trim()) {
    return addSlugIfNeeded(explicitRoute.trim(), tenantSlug, currentRole)
  }

  if (!currentRole) return null

  const route = catalog.routes[currentRole] ?? null
  if (route) return addSlugIfNeeded(route, tenantSlug, currentRole)

  for (const role of audienceRoles) {
    const fallback = catalog.routes[role]
    if (fallback) return addSlugIfNeeded(fallback, tenantSlug, currentRole)
  }

  return null
}

function ensureAudioContext() {
  if (import.meta.server || typeof window === 'undefined') return null

  if (!audioContext) {
    const AudioCtor = window.AudioContext || (window as Window & typeof globalThis & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext

    if (!AudioCtor) return null
    audioContext = new AudioCtor()
  }

  return audioContext
}

async function primeAudioContext() {
  const context = ensureAudioContext()
  if (!context) return

  if (context.state === 'suspended') {
    try {
      await context.resume()
    } catch {
      return
    }
  }
}

function playBibSound() {
  const context = ensureAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, now)
  oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.08)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.2)
}

export const useNotifications = () => {
  const supabase = useSupabase()
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  const items = ref<NotificationViewItem[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const connectionStatus = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const knownNotificationIds = new Set<string>()

  let realtimeChannel: any = null
  let disposed = false

  const role = computed(() => authStore.role ?? profileStore.roles?.[0]?.name ?? null)
  const userId = computed(() => authStore.user?.id ?? profileStore.user?.id ?? null)

  function clearRealtime() {
    if (realtimeChannel && supabase) {
      supabase.removeChannel(realtimeChannel)
    }

    realtimeChannel = null
  }

  function sortItems(list: NotificationViewItem[]) {
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  function upsertLocalRow(row: NotificationRow) {
    const nextItem = toViewItem(row, role.value, authStore.tenantSlug)
    const exists = items.value.findIndex(item => item.id === row.id)
    const isNewRow = !knownNotificationIds.has(row.id)

    if (exists >= 0) {
      items.value.splice(exists, 1, nextItem)
    } else {
      items.value = sortItems([nextItem, ...items.value])
    }

    knownNotificationIds.add(row.id)
    unreadCount.value = items.value.filter(item => !item.is_read).length

    if (isNewRow && !nextItem.is_read) {
      void primeAudioContext().then(() => {
        try {
          playBibSound()
        } catch {
          // Ignore audio failures when the browser blocks autoplay.
        }
      })
    }
  }

  function removeLocalRow(notificationId: string) {
    items.value = items.value.filter(item => item.id !== notificationId)
    knownNotificationIds.delete(notificationId)
    unreadCount.value = items.value.filter(item => !item.is_read).length
  }

  async function loadNotifications() {
    if (!supabase || !userId.value) return

    loading.value = true
    error.value = null

    const query = supabase
      .from('notifications')
      .select('id, user_id, type, title, body, data, is_read, created_at')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(40)

    const { data, error: loadError } = await query.returns<NotificationRow[]>()

    if (loadError) {
      error.value = loadError.message
      loading.value = false
      connectionStatus.value = 'error'
      return
    }

    items.value = sortItems((data ?? []).map(notification => toViewItem(notification, role.value, authStore.tenantSlug)))
    knownNotificationIds.clear()
    for (const item of items.value) {
      knownNotificationIds.add(item.id)
    }
    unreadCount.value = items.value.filter(item => !item.is_read).length
    loading.value = false
  }

  async function refresh() {
    refreshing.value = true
    await loadNotifications()
    refreshing.value = false
  }

  async function markAsRead(notificationId: string) {
    if (!supabase || !userId.value || !notificationId) return

    const target = items.value.find(item => item.id === notificationId)
    if (!target || target.is_read) return

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId.value)

    if (updateError) {
      error.value = updateError.message
      return
    }

    items.value = items.value.map(item => item.id === notificationId ? { ...item, is_read: true } : item)
    unreadCount.value = items.value.filter(item => !item.is_read).length
  }

  async function markAllAsRead() {
    if (!supabase || !userId.value) return

    const unreadIds = items.value.filter(item => !item.is_read).map(item => item.id)
    if (unreadIds.length === 0) return

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId.value)
      .eq('is_read', false)

    if (updateError) {
      error.value = updateError.message
      return
    }

    items.value = items.value.map(item => ({ ...item, is_read: true }))
    unreadCount.value = 0
  }

  async function deleteNotification(notificationId: string) {
    if (!supabase || !userId.value || !notificationId) return

    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId.value)

    if (deleteError) {
      error.value = deleteError.message
      return
    }

    removeLocalRow(notificationId)
  }

  function readNotification(notificationId: string) {
    void markAsRead(notificationId)
  }

  function setupRealtime() {
    clearRealtime()

    if (import.meta.server || !supabase || !userId.value) return

    if (!soundListenersBound && typeof window !== 'undefined') {
      soundListenersBound = true
      const unlockAudio = () => {
        void primeAudioContext()
      }

      window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true })
      window.addEventListener('keydown', unlockAudio, { once: true })
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
    }

    connectionStatus.value = 'connecting'

    realtimeChannel = supabase
      .channel(`notifications-${userId.value}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId.value}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow
          if (!row) return
          upsertLocalRow(row)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId.value}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow
          if (!row) return
          upsertLocalRow(row)
        },
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          connectionStatus.value = 'connected'
        } else if (status === 'CHANNEL_ERROR') {
          connectionStatus.value = 'error'
        } else if (status === 'CLOSED') {
          connectionStatus.value = 'idle'
        }
      })
  }

  watch([role, userId], async () => {
    if (disposed) return

    clearRealtime()
    items.value = []
    unreadCount.value = 0

    if (!userId.value) {
      connectionStatus.value = 'idle'
      return
    }

    await loadNotifications()
    setupRealtime()
  }, { immediate: true })

  onBeforeUnmount(() => {
    disposed = true
    clearRealtime()
  })

  return {
    items,
    unreadCount,
    loading,
    refreshing,
    error,
    connectionStatus,
    role,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    readNotification,
    resolveNotification: toViewItem,
  }
}
