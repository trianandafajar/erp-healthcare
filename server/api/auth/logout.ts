export default defineEventHandler(async (event) => {
  const supabase = serverSupabase(event)

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  const cookies = parseCookies(event)
  for (const key of Object.keys(cookies)) {
    if (key.startsWith('sb-')) {
      deleteCookie(event, key, {
        path: '/',
        sameSite: 'lax',
        // secure: process.env.NODE_ENV === 'production',
      })
    }
  }

  return {
    message: 'Logged out successfully',
  }
})