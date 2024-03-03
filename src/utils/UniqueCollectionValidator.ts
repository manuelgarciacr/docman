import { ChangeDetectorRef, Injectable, inject } from "@angular/core";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";
import { ICollection } from "@domain";
import { CollectionsRepoService, resp } from "@infrastructure";
import { HotToastService } from "@ngneat/hot-toast";
import { Observable, catchError, finalize, map, of} from "rxjs";

@Injectable({ providedIn: "root" })
export class UniqueCollectionValidator implements AsyncValidator {
    private readonly collectionsRepoService = inject(CollectionsRepoService);
    private readonly toast = inject(HotToastService);

    private canceled = false;
    private validating = false;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    validate(control: AbstractControl): Observable<ValidationErrors | null> {

        if (this.canceled) return of(null);

        this.validating = true;

        setTimeout(() => {

            if (!this.validating) return;

            this.toast.loading(`Validating collection`, {
                autoClose: false,
                dismissible: true,
                id: "collectionToast",
            });
        }, 500);

        return this.collectionsRepoService
            .getCollections({ collection: control.value }, "collection-exists")
            .pipe(
                map((res: resp<ICollection>) => {
                    this.validating = false;
                    this.toast.close("collectionToast");

                    if (typeof res.message != "boolean")
                        return { connection: true };

                    return res.message ? { unique: true } : null;
                }),
                catchError(() => {
                    this.validating = false;
                    this.toast.close("collectionToast");
                    return of(null);
                }),
                finalize(() => this.changeDetectorRef.markForCheck())
            );
    }

    cancel = () => {
        this.toast.close("collectionToast");
        this.canceled = true;
    };
}

