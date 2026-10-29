import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Query params arrive as strings; @Type(() => Boolean) would turn "false"
 * into true because Boolean("false") !== false.
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    const raw: unknown = value;

    if (raw === undefined || raw === null || raw === '') return undefined;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') {
      return raw === 1 ? true : raw === 0 ? false : raw;
    }
    if (typeof raw !== 'string') return raw;

    const normalised = raw.toLowerCase();
    if (['true', '1', 'yes'].includes(normalised)) return true;
    if (['false', '0', 'no'].includes(normalised)) return false;

    // Hand it back untouched so @IsBoolean() reports the bad value.
    return raw;
  });
}
