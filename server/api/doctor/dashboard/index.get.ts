export default defineEventHandler(async (event) => {
    const supabase = await supabaseAdmin()

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    // =====================================================
    // SUMMARY
    // =====================================================

    const [
        totalExaminationsResult,
        waitingPatientsResult,
        inProgressResult,
        doneTodayResult,
        totalPrescriptionsResult
    ] = await Promise.all([
        supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', todayStr),

        supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', todayStr)
            .eq('status', 'waiting'),

        supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', todayStr)
            .eq('status', 'in_progress'),

        supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', todayStr)
            .eq('status', 'done'),

        supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
    ])

    // =====================================================
    // PATIENT TREND (7 DAYS)
    // =====================================================

    const { data: trendAppointments } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', sevenDaysAgoStr)
        .order('appointment_date')

    const trendMap: Record<string, number> = {}

    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(sevenDaysAgo.getDate() + i)

        const key = date.toISOString().split('T')[0]
        if (key) {
            trendMap[key] = 0
        }
    }

    trendAppointments?.forEach(item => {
        if (item.appointment_date) {
            trendMap[item.appointment_date] =
                (trendMap[item.appointment_date] || 0) + 1
        }
    })

    const patientTrend = Object.entries(trendMap).map(([date, count]) => ({
        date,
        count
    }))

    // =====================================================
    // PEAK HOURS
    // =====================================================

    const { data: hourAppointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', todayStr)

    const hourMap: Record<string, number> = {}

    for (let h = 8; h <= 17; h++) {
        hourMap[String(h).padStart(2, '0')] = 0
    }

    hourAppointments?.forEach(item => {
        if (!item.appointment_time) return

        const hour = item.appointment_time.substring(0, 2)

        if (hourMap[hour] !== undefined) {
            hourMap[hour]++
        }
    })

    const peakHours = Object.entries(hourMap).map(([hour, count]) => ({
        hour,
        count
    }))

    // =====================================================
    // RECENT EXAMINATIONS
    // =====================================================

    const { data: recentExaminations } = await supabase
        .from('appointments')
        .select(`
            id,
            appointment_time,
            status,
            chief_complaint,
            patients (
                id,
                full_name,
                medical_record_number
            )
        `)
        .eq('appointment_date', todayStr)
        .order('appointment_time')
        .limit(5)

    // =====================================================
    // RECENT PRESCRIPTIONS
    // =====================================================

    const { data: recentPrescriptions } = await supabase
        .from('prescriptions')
        .select(`
            id,
            medication_name,
            dosage,
            frequency,
            duration,
            created_at,
            medical_records (
                patients (
                    id,
                    full_name,
                    medical_record_number
                )
            )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    // =====================================================
    // Top Medicines
    // =====================================================

    const { data: medicines } = await supabase
        .from('prescriptions')
        .select('medication_name')

    const medicineMap: Record<string, number> = {}

    medicines?.forEach(item => {
        if (!item.medication_name) return

        medicineMap[item.medication_name] =
            (medicineMap[item.medication_name] || 0) + 1
    })

    const topMedicines = Object.entries(medicineMap)
        .map(([name, count]) => ({
            name,
            count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    return {
        summary: {
            total_examinations:
                totalExaminationsResult.count ?? 0,

            waiting_patients:
                waitingPatientsResult.count ?? 0,

            in_progress:
                inProgressResult.count ?? 0,

            done_today:
                doneTodayResult.count ?? 0,

            total_prescriptions:
                totalPrescriptionsResult.count ?? 0
        },

        patient_status: {
            waiting:
                waitingPatientsResult.count ?? 0,

            in_progress:
                inProgressResult.count ?? 0,

            done:
                doneTodayResult.count ?? 0
        },

        patient_trend: patientTrend,
        peak_hours: peakHours,
        top_medicines: topMedicines,
        recent_examinations: recentExaminations ?? [],
        recent_prescriptions: recentPrescriptions ?? []
    }
})