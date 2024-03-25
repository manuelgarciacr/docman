import { Injectable, signal } from "@angular/core";
import { ICollection } from "@domain";

const sto = signal(sessionStorage);

@Injectable({
    providedIn: "root",
})
export class CollectionService {
    private _collection = signal<ICollection | null>(null);

    readonly collection = this._collection.asReadonly();

    constructor() {
        const collectionStr = sto().getItem("collection");
        const collection = collectionStr ? JSON.parse(collectionStr) : null;

        this._collection.set(collection);
    }

    setCollection = (collection: ICollection | null) => {
        if (collection) {
            const { _id, name, description, stayLoggedIn, users, roles, documents, enabled } =
                collection;
            collection = {
                _id,
                name,
                description,
                stayLoggedIn,
                users,
                roles,
                documents,
                enabled,
            };
            sto().setItem("collection", JSON.stringify(collection));
        } else {
            sto().removeItem("collection");
        }

        this._collection.set(collection);
    };
}
