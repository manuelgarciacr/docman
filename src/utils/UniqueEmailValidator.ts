import { Injectable, inject } from "@angular/core";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";
import { IUser } from "@domain";
import { UsersRepoService, resp } from "@infrastructure";
import { Observable, catchError, map, of } from "rxjs";

@Injectable({ providedIn: "root" })
export class UniqueEmailValidator implements AsyncValidator {
    private readonly usersRepoService = inject(UsersRepoService);
    // private onChange: () => void = () => null;

    validate(control: AbstractControl): Observable<ValidationErrors | null> {
        return this.usersRepoService
            .getUsers({ email: control.value }, "email-exists")
            .pipe(
                map((res: resp<IUser>) =>
                    res.message ? { unique: true } : null
                ),
                catchError(() => of(null)),
        );
    }
    // registerOnValidatorChange?(fn: () => void): void {
    //     this.onChange = fn;
    // }
}
