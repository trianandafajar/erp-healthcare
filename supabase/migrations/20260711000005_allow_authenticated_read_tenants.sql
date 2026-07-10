-- Izinkan user terautentikasi membaca tenant (dibutuhkan onboarding flow
-- dimana profile.tenant_id belum di-set saat akses halaman configure)

create policy "authenticated_can_read_tenants"
    on public.tenants for select
    to authenticated
    using (true);
