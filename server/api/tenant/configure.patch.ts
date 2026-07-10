export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)

  const supabase = serverSupabase(event)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const tenantSlug = formData.get('tenant_slug') as string | null
  if (!tenantSlug) {
    throw createError({ statusCode: 400, message: 'Tenant slug is required' })
  }

  const admin = supabaseAdmin()

  const { data: tenant, error: tenantErr } = await admin
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (tenantErr || !tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  const tenantId = tenant.id

  const brandColor = formData.get('brand_color') as string | null
  const displayName = formData.get('display_name') as string | null
  const logoFile = formData.get('logo') as File | null

  if (brandColor) {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexColorRegex.test(brandColor)) {
      throw createError({ statusCode: 400, message: 'Invalid brand color format. Must be hex (e.g. #176D37)' })
    }

    await admin
      .from('tenants')
      .update({ brand_color: brandColor })
      .eq('id', tenantId)
  }

  let logoUrl: string | null = null

  if (logoFile && logoFile.size > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(logoFile.type)) {
      throw createError({ statusCode: 400, message: 'Invalid file type. Only JPG, PNG, or WebP are allowed.' })
    }

    if (logoFile.size > 2 * 1024 * 1024) {
      throw createError({ statusCode: 400, message: 'File too large. Maximum size is 2 MB.' })
    }

    const ext = logoFile.name.split('.').pop() ?? 'png'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `${tenantId}/${fileName}`

    const arrayBuffer = await logoFile.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from('tenant-logos')
      .upload(filePath, buffer, {
        contentType: logoFile.type,
        upsert: true,
      })

    if (uploadError) {
      throw createError({ statusCode: 500, message: uploadError.message })
    }

    const { data: urlData } = admin.storage
      .from('tenant-logos')
      .getPublicUrl(filePath)

    logoUrl = urlData.publicUrl
  }

  const settingsUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }
  if (displayName) settingsUpdate.display_name = displayName
  if (logoUrl) settingsUpdate.logo_url = logoUrl

  if (Object.keys(settingsUpdate).length > 1) {
    await admin
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        ...settingsUpdate,
      }, { onConflict: 'tenant_id' })
  }

  // Finalisasi: set owner dan kaitkan user ke tenant
  await admin
    .from('tenants')
    .update({ owner_id: user.id })
    .eq('id', tenantId)

  await admin
    .from('profiles')
    .update({ tenant_id: tenantId })
    .eq('id', user.id)

  return { success: true }
})
