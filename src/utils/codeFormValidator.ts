import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const codeFormValidator = (length = 5): ValidatorFn => {
    return (
        control: AbstractControl
    ): ValidationErrors | null => {
        const value = control.value;
        const status = (value == "0".repeat(length))
            ? { zeros: { value: control.value } }
            : null;

        return status;
    }
}
