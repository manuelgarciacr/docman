import { ChangeDetectorRef, Injectable, inject } from "@angular/core";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";
import { IUser } from "@domain";
import { Resp, UsersRepoService } from "@infrastructure";
import { HotToastService } from "@ngneat/hot-toast";
import { Observable, catchError, finalize, map, of } from "rxjs";

@Injectable({ providedIn: "root" })
export class UniqueEmailValidator implements AsyncValidator {
    private readonly usersRepoService = inject(UsersRepoService);
    private readonly toast = inject(HotToastService);

    private canceled = false;
    private validating = false;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    validate(control: AbstractControl): Observable<ValidationErrors | null> {

        if (this.canceled) return of(null);

        this.validating = true;

        setTimeout(() => {

            if ( !this.validating ) return;

            this.toast.loading(`Validating email`, {
                autoClose: false,
                dismissible: true,
                id: "emailToast",
            });
        }, 500)

        return this.usersRepoService
            .getUsers({ email: control.value }, "email-exists")
            .pipe(
                map((res: Resp<IUser[]>) => {
                    this.validating = false;
                    this.toast.close("emailToast");

                    if (typeof res.message != "boolean")
                        return { connection: true };

                    return res.message ? { unique: true } : null;
                }),
                catchError(() => {
                    this.validating = false;
                    this.toast.close("emailToast");
                    return of(null)
                }),
                finalize(() => this.changeDetectorRef.markForCheck())
            );
    }

    cancel = () => {
        this.toast.close("emailToast");
        this.canceled = true;
    };
}
