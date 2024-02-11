import { Injectable } from "@angular/core";
import { ICollection } from "@domain";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private _collection = new BehaviorSubject<ICollection | null>(null);
    readonly collection$: Observable<ICollection | null> = this._collection.asObservable();

    setCollection = (collection: ICollection) => this._collection.next(collection);
    getCollection = () => this._collection.getValue();
}
