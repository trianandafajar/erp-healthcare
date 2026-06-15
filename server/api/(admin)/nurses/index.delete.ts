export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: before } = await admin
    .from('nurses')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('nurses')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'nurses',
    p_entity_id: id,
    p_description: `Removed nurse profile for ${(before as any)?.profiles?.full_name ?? 'a nurse'}`,
    p_metadata: { before: before ?? null }
  })

  return { message: 'Nurse profile removed successfully' }
})