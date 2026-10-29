/**
 * The shape of one entry inside a `params` array.
 *
 * `groups` is only used by DOCUMENT_TYPE, where it declares which
 * DOCUMENT_GROUP values the type belongs to (a driver's licence is personal,
 * insurance is per vehicle). Everything else ignores it.
 */
export type ParamOption = {
  key: string;
  label: string;
  symbol?: string;
  groups?: string[];
};
