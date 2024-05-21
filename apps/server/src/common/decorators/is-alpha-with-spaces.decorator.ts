import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

export function IsAlphaWithSpaces(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsAlphaWithSpacesConstraint,
    })
  }
}

@ValidatorConstraint({ name: 'IsAlphaWithSpaces' })
export class IsAlphaWithSpacesConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return /^[A-Za-z ]+$/.test(value)
  }
}
