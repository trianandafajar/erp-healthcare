import type { PrescriptionStatus } from '~/data/pharmacy'

type PrescriptionRow = {
    id: string
    medical_record_id: string
    medication_name: string
    dosage: string | null
    frequency: string | null
    duration: string | null
    instructions: string | null
    status: PrescriptionStatus | string | null
    pharmacist_note: string | null
    rejection_note: string | null
    verified_at: string | null
    dispensed_at: string | null
    created_at: string
    updated_at: string | null
    patients: {
        full_name: string | null
        medical_record_number: string | null
    } | null
    doctors: {
        profiles: {
            full_name: string | null
        } | null
    } | null
}

function normalizeStatus(status: string | null | undefined): PrescriptionStatus {
    if (status === 'Verified' || status === 'Rejected' || status === 'Dispensed') {
        return status
    }

    return 'Pending'
}

export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('prescriptions')
        .select(`
            id,
            medical_record_id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            status,
            pharmacist_note,
            rejection_note,
            verified_at,
            dispensed_at,
            created_at,
            updated_at,
            patients (
                full_name,
                medical_record_number
            ),
            doctors (
                profiles (
                    full_name
                )
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: error.message,
        })
    }

    const records = (data ?? []).map((item) => {
        const row = item as unknown as PrescriptionRow
        const status = normalizeStatus(row.status)
        const doctorName = row.doctors?.profiles?.full_name?.trim() || '-'

        return {
            id: row.id,
            medicalRecordId: row.medical_record_id,
            patientName: row.patients?.full_name?.trim() || '-',
            mrn: row.patients?.medical_record_number?.trim() || '-',
            doctorName,
            medicines: [row.medication_name],
            dosage: row.dosage,
            frequency: row.frequency,
            duration: row.duration,
            instructions: row.instructions,
            note: row.instructions ?? '-',
            priority: status === 'Pending' ? 'High' : status === 'Verified' ? 'Medium' : 'Low',
            status,
            requestedAt: row.created_at,
            verifiedAt: row.verified_at,
            dispensedAt: row.dispensed_at,
            pharmacistNote: row.pharmacist_note,
            rejectionNote: row.rejection_note,
            lastUpdatedAt: row.updated_at ?? row.created_at,
        }
    })

    return records
})
