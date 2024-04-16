import { ElementRef, Signal } from "@angular/core";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const codeFormControl = (codeElement: Signal<ElementRef>, length = 5): ValidatorFn => {
    return (
        control: AbstractControl
    ): ValidationErrors | null => {
        const el = codeElement()?.nativeElement as HTMLInputElement;
        const pos = [el?.selectionStart, el?.selectionEnd];
        let value = control.value;

        if (value.length == length) {
            return null;
        }

        if (!value || value.length < length) {
            value += "0".repeat(length)
        }

        if (value.length > length) {
            value = value.slice(0, length)
        }

        control.setValue(value, {
            emitEvent: false,
            onlySelf: true
        });

        el.setSelectionRange(pos[0], pos[1])

        return null
    }
}
