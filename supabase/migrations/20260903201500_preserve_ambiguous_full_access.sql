update public.iv_member_entitlements
set
  package = 'INTERMEDIATE',
  core_academy_access = 'FULL',
  developer_lab_access = false,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'package_resolution', 'ambiguous_existing_full_access',
    'package_resolution_reason', 'Historical active entitlement had full access but no verified package amount.'
  )
where status = 'active'
  and source in ('admin', 'grandfathered')
  and coalesce(metadata->>'package_resolution', '') <> 'ambiguous_existing_full_access';
