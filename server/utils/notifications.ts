import type { SupabaseClient } from '@supabase/supabase-js'

export type NotificationLevel = 'info' | 'success' | 'warning' | 'critical'

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

export type NotificationInsert = {
  user_id: string
  type: string
  title: string
  body?: string | null
  data?: Record<string, any> | null
  is_read?: boolean
}

const ROLE_GROUPS: Record<string, string[]> = {
  admin: ['admin'],
  doctor: ['doctor', 'specialist'],
  nurse: ['nurse'],
  pharmacy: ['pharmacy', 'pharmacist'],
  receptionist: ['receptionist'],
  patient: ['patient'],
}

export function getRoleGroup(role: string | null | undefined): string[] {
  if (!role) return []
  return ROLE_GROUPS[role] ?? [role]
}

export async function getUserRoleName(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)
    .returns<any[]>()

  if (error) throw error

  return (data as any)?.[0]?.roles?.name ?? null
}

export async function getRecipientIdsByRoles(
  admin: SupabaseClient,
  roleNames: string[],
  excludeUserId?: string | null,
): Promise<string[]> {
  if (roleNames.length === 0) return []

  const { data, error } = await admin
    .from('user_roles')
    .select('user_id, roles(name)')
    .returns<any[]>()

  if (error) throw error

  return (data ?? [])
    .filter((row) => roleNames.includes(row.roles?.name))
    .map((row) => row.user_id as string)
    .filter((userId) => (excludeUserId ? userId !== excludeUserId : true))
    .filter((userId, index, arr) => arr.indexOf(userId) === index)
}

export async function insertNotifications(admin: SupabaseClient, notifications: NotificationInsert[]) {
  if (notifications.length === 0) return []

  const { data, error } = await admin
    .from('notifications')
    .insert(notifications)
    .select('*')

  if (error) throw error
  return data ?? []
}

export function parseBloodPressure(value: string | null | undefined) {
  if (!value) return null

  const parts = value.split('/').map(part => Number(part.trim()))
  if (parts.length !== 2 || parts.some(part => !Number.isFinite(part))) return null

  const [systolic, diastolic] = parts
  return { systolic, diastolic }
}

export function resolveVitalLevel(input: {
  bloodPressure?: string | null
  temperature?: number | null
  pulse?: number | null
}): NotificationLevel | null {
  const bp = parseBloodPressure(input.bloodPressure)
  const temp = input.temperature
  const pulse = input.pulse

  const isCritical =
    (bp !== null && (bp.systolic >= 180 || bp.diastolic >= 120 || bp.systolic <= 80 || bp.diastolic <= 50)) ||
    (typeof temp === 'number' && (temp >= 39 || temp <= 35)) ||
    (typeof pulse === 'number' && (pulse >= 120 || pulse <= 50))

  if (isCritical) return 'critical'

  const isWarning =
    (bp !== null && (bp.systolic >= 140 || bp.diastolic >= 90)) ||
    (typeof temp === 'number' && temp >= 38) ||
    (typeof pulse === 'number' && pulse >= 100)

  if (isWarning) return 'warning'

  return null
}
