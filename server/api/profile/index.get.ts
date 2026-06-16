export default defineEventHandler(async (event) => {
  const supabase = serverSupabase(event)

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found',
    })
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('roles(id, label)')
    .eq('user_id', user.id)

  const roles = userRoles?.map((r: any) => r.roles).filter(Boolean) ?? []

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    roles,
  }
})