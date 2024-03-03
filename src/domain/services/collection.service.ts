import { Injectable, signal } from "@angular/core";
import { ICollection } from "@domain";

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private _collection = signal<ICollection | null>(null)

    readonly collection = this._collection.asReadonly();

    setCollection = (collection: ICollection | null) => this._collection.set(collection);
}
