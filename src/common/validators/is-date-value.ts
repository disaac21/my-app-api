import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * `@Type(() => Date)` runs before validation, so by the time the validators see
 * the field it is already a `Date` — and `@IsISO8601()` only accepts strings,
 * so it fails on every valid payload.
 *
 * This validates the parsed value instead. The wire format stays an ISO 8601
 * string (Prisma also accepts the string directly), but the field the service
 * receives is a real `Date`, which is what the date arithmetic needs.
 *
 * `new Date('not a date')` produces an Invalid Date rather than throwing, so
 * that case still fails here.
 */
export function IsDateValue(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateValue',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid ISO 8601 date string`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return value instanceof Date && !Number.isNaN(value.getTime());
        },
      },
    });
  };
}
