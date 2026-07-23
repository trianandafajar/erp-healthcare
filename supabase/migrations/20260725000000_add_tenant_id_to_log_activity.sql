-- Update log_activity function to accept and store tenant_id
CREATE OR REPLACE FUNCTION public.log_activity(
    p_actor_id uuid,
    p_action text,
    p_module text,
    p_entity_id text,
    p_description text,
    p_metadata jsonb DEFAULT NULL::jsonb,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  insert into public.activity_logs (actor_id, action, module, entity_id, description, metadata, tenant_id)
  values (p_actor_id, p_action, p_module, p_entity_id, p_description, p_metadata, p_tenant_id);
end;
$function$;
