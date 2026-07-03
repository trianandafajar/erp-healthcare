import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
  const { admin, tenantId, user } = await getTenantContext(event);

  const { data: roleData, error: roleError } = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .returns<any[]>();

  if (roleError) {
    throw createError({ statusCode: 400, message: roleError.message });
  }

  const role = (roleData as any)?.[0]?.roles?.name;

  if (role !== "nurse") {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const { search } = getQuery(event);
  const keyword = typeof search === "string" ? search.trim().toLowerCase() : "";

  const { data, error } = await admin
    .from("patients")
    .select(
      `
            id,
            medical_record_number,
            profile_id,
            full_name,
            date_of_birth,
            gender,
            phone,
            address,
            blood_type,
            created_at,
            updated_at,
            profiles (
                email,
                status
            )
        `,
    )
    .eq('tenant_id', tenantId)
    .order("created_at", { ascending: false })
    .returns<any[]>();

  if (error) {
    throw createError({ statusCode: 400, message: error.message });
  }

  const patients = (data ?? [])
    .map((patient) => ({
      id: patient.id,
      medical_record_number: patient.medical_record_number ?? "-",
      profile_id: patient.profile_id ?? null,
      full_name: patient.full_name ?? "-",
      date_of_birth: patient.date_of_birth ?? "",
      gender: patient.gender ?? null,
      phone: patient.phone ?? "-",
      address: patient.address ?? "-",
      blood_type: patient.blood_type ?? null,
      email: patient.profiles?.email ?? null,
      status: patient.profiles?.status ?? null,
      has_account: !!patient.profile_id,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
    }))
    .filter((patient) => {
      if (!keyword) return true;

      return [
        patient.full_name,
        patient.medical_record_number,
        patient.phone,
        patient.address,
        patient.gender,
        patient.blood_type ?? "",
        patient.status ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

  return { patients };
});
