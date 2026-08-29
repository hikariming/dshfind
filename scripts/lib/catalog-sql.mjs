export function catalogItemSQL(alias) {
  return `(${alias}.repository_full_name IS NOT NULL OR ${alias}.has_bundle = 1 OR NOT EXISTS (
    SELECT 1 FROM plugins child
    WHERE child.repository_full_name = ${alias}.full_name AND child.is_present = 1
  ))`;
}
