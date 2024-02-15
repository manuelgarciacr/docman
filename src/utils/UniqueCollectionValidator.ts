import { Injectable, inject } from "@angular/core";
import {
    AbstractControl,
    AsyncValidator,
    ValidationErrors,
} from "@angular/forms";
import { ICollection } from "@domain";
import {
    CollectionsRepoService,
    resp,
} from "@infrastructure";
import { Observable, catchError, map, of } from "rxjs";

@Injectable({ providedIn: "root" })
export class UniqueCollectionValidator implements AsyncValidator {
    private readonly collectionsRepoService = inject(CollectionsRepoService);
    // private onChange: () => void = () => null;

    validate(control: AbstractControl): Observable<ValidationErrors | null> {
        return this.collectionsRepoService
            .getCollections({ name: control.value }, "collection-exists")
            .pipe(
                map((res: resp<ICollection>) =>
                    res.message ? { unique: true } : null
                ),
                catchError(() => of(null))
            );
    }
    // registerOnValidatorChange?(fn: () => void): void {
    //     this.onChange = fn;
    // }
}

