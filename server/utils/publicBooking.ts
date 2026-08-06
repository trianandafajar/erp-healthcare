export function toMinutes(timeStr: string | null | undefined): number {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    return Number(parts[0]) * 60 + Number(parts[1])
}

export function toTimeStr(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface DoctorSlotOptions {
    startMin: number
    endMin: number
    duration: number
    maxPatients: number
    bookedByTime: Record<string, number>
    isToday: boolean
    nowMin: number
}

export function computeDoctorSlots({
    startMin,
    endMin,
    duration,
    maxPatients,
    bookedByTime,
    isToday,
    nowMin,
}: DoctorSlotOptions): string[] {
    if (!duration || duration < 5) return []
    if (endMin <= startMin) return []

    const slots: string[] = []
    for (let t = startMin; t + duration <= endMin; t += duration) {
        const timeStr = toTimeStr(t)
        if (isToday && t <= nowMin) continue
        if ((bookedByTime[timeStr] ?? 0) >= maxPatients) continue
        slots.push(timeStr)
    }
    return slots
}
