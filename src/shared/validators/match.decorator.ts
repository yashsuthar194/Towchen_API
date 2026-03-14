import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom class-validator decorator that checks whether a property's
 * value matches the value of another property on the same object.
 *
 * @param property - The name of the property to compare against
 * @param validationOptions - Optional class-validator options
 *
 * @example
 * ```typescript
 * class RegisterDto {
 *   password: string;
 *
 *   @Match('password', { message: 'passwords do not match' })
 *   confirm_password: string;
 * }
 * ```
 */
export function Match(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
