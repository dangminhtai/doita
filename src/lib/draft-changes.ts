// Compare editable values, not IDs or the presence of already-saved content.
export function draftHasChanges<T>(
  current: T,
  saved: T,
  fields: readonly (keyof T)[],
  existing: boolean,
  hasContent: boolean,
) {
  if (!existing && !hasContent) return false;
  return fields.some((field) => {
    const a = current[field];
    const b = saved[field];
    return typeof a === "string" && typeof b === "string"
      ? a.trim() !== b.trim()
      : a !== b;
  });
}
