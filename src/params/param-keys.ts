/**
 * One row per kind in `params`. These are the only valid values of `Param.key`,
 * and the only codes the rest of the API will accept as a param reference.
 *
 * Adding a kind is a code change (something has to consume it); adding an
 * *option* to a kind is a PATCH.
 */
export const PARAM_KEYS = [
  'DISTANCE_UNIT',
  'VOLUME_UNIT',
  'PRESSURE_UNIT',
  'CURRENCY',
  'FUEL_TYPE',
  'TRANSMISSION_TYPE',
  'DRIVE_TYPE',
  'MAINTENANCE_TYPE',
  'DOCUMENT_GROUP',
  'DOCUMENT_TYPE',
  'READING_SOURCE',
] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];

export function isParamKey(value: string): value is ParamKey {
  return (PARAM_KEYS as readonly string[]).includes(value);
}
