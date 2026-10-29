/** Query strings are strings; `?includeArchived` means true, `?includeArchived=false` does not. */
export function parseFlag(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return false;

  const normalised = value.toLowerCase();
  return ['true', '1', 'yes'].includes(normalised);
}
