export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()

    const { year } = getQuery(event)
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear()

    const startDate = `${targetYear}-01-01`
    const endDate = `${targetYear}-12-31`

    const { data, error } = await admin
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }

    const monthlyCounts = Array(12).fill(0)

    data?.forEach((appointment) => {
        const month = new Date(
            appointment.appointment_date
        ).getMonth()

        monthlyCounts[month]++
    })

    return {
        months: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ],
        series: monthlyCounts,
        total: monthlyCounts.reduce(
            (a, b) => a + b,
            0
        )
    }
})