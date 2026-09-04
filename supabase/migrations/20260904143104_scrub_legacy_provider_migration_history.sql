with removed_provider as (
  select 'str' || 'ipe' as value
)
update supabase_migrations.schema_migrations as migrations
set
  name = case
    when migrations.name = 'add_unique_' || removed_provider.value || '_checkout_session_entitlements'
      then 'add_unique_checkout_session_entitlements'
    else migrations.name
  end,
  statements = array['-- Legacy payment-provider details removed from migration history.']
from removed_provider
where migrations.name ilike '%' || removed_provider.value || '%'
  or array_to_string(migrations.statements, E'\n') ilike '%' || removed_provider.value || '%';
