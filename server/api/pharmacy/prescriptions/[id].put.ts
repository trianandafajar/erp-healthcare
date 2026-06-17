import type { PrescriptionStatus } from '~/data/pharmacy'

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
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Prescription id is required',
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

    return {
        success: true,
        id,
        status,
    }
})
