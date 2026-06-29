import type { PrescriptionStatus } from '~/data/pharmacy'
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

type PrescriptionUpdateBody = {
    status?: PrescriptionStatus
    pharmacistNote?: string | null
    rejectionNote?: string | null
}

function normalizeStatus(status: PrescriptionStatus | undefined): PrescriptionStatus {
    if (status === 'Verified' || status === 'Rejected' || status === 'Dispensed') {
        return status
    }

    return 'Pending'
}

export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const id = getRouterParam(event, 'id')

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Prescription id is required',
        })
    }

    const { data: current, error: currentError } = await admin
        .from('prescriptions')
        .select(`
            id,
            patient_id,
            doctor_id,
            medication_name,
            status,
            patients (
                full_name
            ),
            doctors (
                profiles (
                    full_name
                )
            )
        `)
        .eq('id', id)
        .single()

    if (currentError || !current) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: currentError?.message ?? 'Prescription not found',
        })
    }

    const body = await readBody<PrescriptionUpdateBody>(event)
    const status = normalizeStatus(body.status)
    const now = new Date().toISOString()

    const patch: Record<string, string | null> = {
        status,
        pharmacist_note: body.pharmacistNote ?? null,
        updated_at: now,
    }

    if (status === 'Verified') {
        patch.verified_at = now
        patch.dispensed_at = null
        patch.rejection_note = null
    }

    if (status === 'Dispensed') {
        patch.dispensed_at = now
        patch.rejection_note = null
    }

    if (status === 'Rejected') {
        patch.rejection_note = body.rejectionNote?.trim() || 'Returned to doctor'
        patch.verified_at = null
        patch.dispensed_at = null
    }

    const { error } = await admin
        .from('prescriptions')
        .update(patch)
        .eq('id', id)

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: error.message,
        })
    }

    if (current.status !== status) {
        const pharmacyRecipients = await getRecipientIdsByRoles(admin, ['pharmacy'], user?.id ?? null)
        const doctorRecipients = current.doctor_id ? [current.doctor_id] : []
        const { data: patientRow } = await admin
            .from('patients')
            .select('profile_id')
            .eq('id', current.patient_id)
            .single()
        const patientRecipients = patientRow?.profile_id ? [patientRow.profile_id as string] : []

        const recipientIds = Array.from(new Set([
            ...(user?.id ? [user.id] : []),
            ...pharmacyRecipients,
            ...doctorRecipients,
            ...patientRecipients,
        ]))

        const notificationType =
            status === 'Verified'
                ? 'prescription_verified'
                : status === 'Dispensed'
                    ? 'prescription_ready'
                    : 'prescription_rejected'

        const title =
            status === 'Verified'
                ? 'Prescription verified'
                : status === 'Dispensed'
                    ? 'Medication ready for pickup'
                    : 'Prescription rejected'

        const bodyText =
            status === 'Verified'
                ? `${current.medication_name} has been verified by pharmacy.`
                : status === 'Dispensed'
                    ? `${current.medication_name} is ready to be dispensed.`
                    : `${current.medication_name} was rejected by pharmacy.`

        await insertNotifications(
            admin,
            recipientIds.map(user_id => ({
                user_id,
                type: notificationType,
                title,
                body: bodyText,
                data: {
                    entity_type: 'prescription',
                    entity_id: current.id,
                    patient_id: current.patient_id,
                    doctor_id: current.doctor_id,
                    medication_name: current.medication_name,
                    level: status === 'Rejected' ? 'critical' : 'success',
                    audience_role: pharmacyRecipients.includes(user_id) ? 'pharmacy' : undefined,
                    redirect_to:
                        status === 'Dispensed'
                            ? '/pharmacy/dispensing'
                            : status === 'Verified'
                                ? '/pharmacy/verification'
                                : '/pharmacy/verification',
                },
            })),
        )
    }

    return {
        success: true,
        id,
        status,
    }
})
