# Module Completion Verification

This repository does not currently include a test runner or TypeScript script runtime.

Use the checks below to verify module completion behavior from existing education progress data.

## Completion contract

A module is considered complete when the latest quiz attempt for that module has passed=true.

This matches current academy behavior where users can only open a module quiz after finishing all module lessons in the UI.

## Verify data source

1. Find the authenticated user in iv_user_profiles and note privy_user_id.
2. Resolve the corresponding auth user via education identity mapping.
3. Query quiz_results ordered by attempted_at descending.
4. For each module_index 0-5, use the latest row only.
5. ModuleNumber is module_index + 1.
6. completed is true when latest row passed=true.

## SQL sanity checks

```sql
-- Latest quiz row per module for one user
with ranked as (
  select
    module_index,
    score,
    passed,
    attempted_at,
    row_number() over (
      partition by module_index
      order by attempted_at desc
    ) as rn
  from quiz_results
  where user_id = :resolved_user_id
)
select
  module_index,
  score,
  passed,
  attempted_at
from ranked
where rn = 1
order by module_index asc;
```

## Expected mapping

- moduleNumber in [1..6]
- completed=false if no row for module
- completed=false if latest row passed=false
- completed=true if latest row passed=true
