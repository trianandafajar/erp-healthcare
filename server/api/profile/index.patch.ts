export default defineEventHandler(async (event) => {
  const supabase = serverSupabase(event)

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<{ full_name?: string }>(event)
  const full_name = body?.full_name?.trim()

  if (!full_name) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    throw createError({ statusCode: 500, message: updateError.message })
  }

  return { profile }
})