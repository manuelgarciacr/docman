import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function checkPasswordValidator(minLower = 1, minUpper = 1, minSpecial = 1, minDigit = 1): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const len = control.value?.length | 0;
        const lower = control.value?.match(/[a-z]/g)?.length | 0;
        const upper = control.value?.match(/[A-Z]/g)?.length | 0;
        const digit = control.value?.match(/\d/g)?.length | 0;
        const special = len - lower - upper - digit;

        let error = (minLower == null && lower > 0) || lower < minLower;
        error = error || (minUpper == null && upper > 0) || upper < minUpper;
        error = error || (minDigit == null && digit > 0) || digit < minDigit;
        error = error || (minSpecial == null && special > 0) || special < minSpecial;

        return error ? { checkPassword: { value: control.value } } : null;
    }
}
